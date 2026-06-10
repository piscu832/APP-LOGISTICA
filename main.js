document.addEventListener('DOMContentLoaded', () => {
    const addContactBtn = document.getElementById('add-contact');
    const extraContactsContainer = document.getElementById('extra-contacts');
    const downloadPngBtn = document.getElementById('download-png');
    const downloadPdfBtn = document.getElementById('download-pdf');
    const formElement = document.getElementById('form-to-export');
    const saveFormBtn = document.getElementById('save-form');
    const viewTemplatesBtn = document.getElementById('view-templates');
    const sidebar = document.getElementById('templates-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const closeSidebarBtn = document.getElementById('close-sidebar');
    const templatesList = document.getElementById('templates-list');
    const nroPedidoInput = document.getElementById('nro-pedido');
    
    // Calendar elements
    const calendarTrigger = document.getElementById('calendar-trigger');
    const hiddenDatePicker = document.getElementById('hidden-date-picker');
    const dateInput = document.getElementById('date-input');

    // Default Date on load if it's the hardcoded value
    if (dateInput.value === "04 de Mayo 2026") {
        const today = new Date();
        const options = { day: '2-digit', month: 'long', year: 'numeric' };
        let formattedDate = today.toLocaleDateString('es-ES', options);
        formattedDate = formattedDate.replace(/(\d+) de (\w+)/, (match, d, m) => {
            return `${d} de ${m.charAt(0).toUpperCase() + m.slice(1)}`;
        });
        dateInput.value = formattedDate;
    }

    // Handle calendar trigger
    calendarTrigger.addEventListener('click', () => {
        hiddenDatePicker.showPicker(); // Modern way to open date picker
    });

    hiddenDatePicker.addEventListener('change', (e) => {
        const date = new Date(e.target.value);
        if (!isNaN(date.getTime())) {
            // Adjust for timezone offset to get the correct local date
            const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
            
            const options = { day: '2-digit', month: 'long', year: 'numeric' };
            let formattedDate = localDate.toLocaleDateString('es-ES', options);
            
            // Capitalize month if needed (browser dependent)
            formattedDate = formattedDate.replace(/(\d+) de (\w+)/, (match, d, m) => {
                return `${d} de ${m.charAt(0).toUpperCase() + m.slice(1)}`;
            });
            
            dateInput.value = formattedDate;
            saveFormData();
        }
    });

    // Helper to add a contact item
    const addExtraContact = (value = '') => {
        const contactDiv = document.createElement('div');
        contactDiv.className = 'contact-item';
        contactDiv.innerHTML = `
            <span class="bullet">-</span>
            <input type="text" placeholder="Nuevo contacto..." class="editable-field" value="${value}">
            <button class="remove-contact" style="background:none; border:none; color:red; cursor:pointer; font-size:12px; margin-left:5px;">×</button>
        `;
        extraContactsContainer.appendChild(contactDiv);

        contactDiv.querySelector('.remove-contact').addEventListener('click', () => {
            contactDiv.remove();
            saveFormData();
        });

        contactDiv.querySelector('input').addEventListener('input', saveFormData);
    };

    // Handle adding extra contacts
    addContactBtn.addEventListener('click', () => {
        addExtraContact();
        saveFormData();
    });

    // Persistence with sessionStorage
    const saveFormData = () => {
        const data = {
            fields: {},
            extraContacts: []
        };
        
        // Save fields with ID
        formElement.querySelectorAll('input[id], textarea[id]').forEach(el => {
            data.fields[el.id] = el.value;
        });
        
        // Save extra contacts
        extraContactsContainer.querySelectorAll('.contact-item input').forEach(input => {
            data.extraContacts.push(input.value);
        });
        
        sessionStorage.setItem('logisticsFormData', JSON.stringify(data));
    };

    const loadFormData = () => {
        const saved = sessionStorage.getItem('logisticsFormData');
        if (!saved) return;
        
        try {
            const data = JSON.parse(saved);
            
            // Load fields with ID
            Object.keys(data.fields).forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = data.fields[id];
            });
            
            // Load extra contacts
            if (data.extraContacts && data.extraContacts.length > 0) {
                extraContactsContainer.innerHTML = '';
                data.extraContacts.forEach(val => {
                    addExtraContact(val);
                });
            }
        } catch (e) {
            console.error('Error loading form data', e);
        }
    };

    // Listen for changes on all inputs and textareas
    formElement.addEventListener('input', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            saveFormData();
        }
    });

    // Initial load
    loadFormData();

    // --- TEMPLATES / DATABASE LOGIC ---
    
    const openSidebar = () => {
        renderTemplates();
        sidebar.classList.add('open');
        overlay.classList.add('active');
    };
    
    const closeSidebar = () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    };

    viewTemplatesBtn.addEventListener('click', openSidebar);
    closeSidebarBtn.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);

    const getTemplates = () => {
        const saved = localStorage.getItem('logisticsTemplates');
        return saved ? JSON.parse(saved) : [];
    };

    const saveTemplateToDB = () => {
        const templates = getTemplates();
        
        // Generate Order Number based on current date
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const prefix = `${year}${month}${day}`;

        let nextNum = 1;
        templates.forEach(t => {
            if (t.id && t.id.startsWith(prefix)) {
                const parts = t.id.split('-');
                if (parts.length === 2) {
                    const num = parseInt(parts[1], 10);
                    if (num >= nextNum) {
                        nextNum = num + 1;
                    }
                }
            }
        });

        // Always generate a new ID on save to keep history
        const newId = `${prefix}-${String(nextNum).padStart(3, '0')}`;
        nroPedidoInput.value = newId;

        const dataToSave = {
            id: newId,
            date: dateInput.value,
            empresa: document.getElementById('empresa').value || 'Sin Empresa',
            fields: {},
            extraContacts: []
        };
        
        // Save fields
        formElement.querySelectorAll('input[id], textarea[id]').forEach(el => {
            dataToSave.fields[el.id] = el.value;
        });
        
        // Save extra contacts
        extraContactsContainer.querySelectorAll('.contact-item input').forEach(input => {
            dataToSave.extraContacts.push(input.value);
        });

        templates.unshift(dataToSave); // Add to beginning
        localStorage.setItem('logisticsTemplates', JSON.stringify(templates));
        
        alert(`Formulario guardado en plantillas con el Nº de Pedido: ${newId}`);
        saveFormData(); // Update session draft
    };

    saveFormBtn.addEventListener('click', saveTemplateToDB);

    const renderTemplates = () => {
        const templates = getTemplates();
        templatesList.innerHTML = '';
        
        if (templates.length === 0) {
            templatesList.innerHTML = '<p style="text-align: center; color: var(--text-muted); margin-top: 2rem;">No hay plantillas guardadas.</p>';
            return;
        }

        templates.forEach(t => {
            const card = document.createElement('div');
            card.className = 'template-card';
            card.innerHTML = `
                <div class="template-header">
                    <span class="template-id">${t.id}</span>
                    <span class="template-date">${t.date}</span>
                </div>
                <div class="template-company">${t.empresa}</div>
                <div class="template-actions">
                    <button class="btn btn-primary btn-sm btn-load" data-id="${t.id}">Usar Plantilla</button>
                    <button class="btn btn-danger btn-sm btn-delete" data-id="${t.id}">Borrar</button>
                </div>
            `;
            templatesList.appendChild(card);
        });

        templatesList.querySelectorAll('.btn-load').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                loadTemplateFromDB(id);
                closeSidebar();
            });
        });

        templatesList.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                if (confirm('¿Estás seguro de que quieres borrar este formulario?')) {
                    deleteTemplateFromDB(id);
                    renderTemplates(); // Re-render
                }
            });
        });
    };

    const loadTemplateFromDB = (id) => {
        const templates = getTemplates();
        const data = templates.find(t => t.id === id);
        if (!data) return;

        // Load fields
        Object.keys(data.fields).forEach(fieldId => {
            const el = document.getElementById(fieldId);
            if (el) el.value = data.fields[fieldId];
        });
        
        // Load extra contacts
        extraContactsContainer.innerHTML = '';
        if (data.extraContacts && data.extraContacts.length > 0) {
            data.extraContacts.forEach(val => {
                addExtraContact(val);
            });
        }
        
        // Reset ID for new saves
        nroPedidoInput.value = '';
        saveFormData();
    };

    const deleteTemplateFromDB = (id) => {
        let templates = getTemplates();
        templates = templates.filter(t => t.id !== id);
        localStorage.setItem('logisticsTemplates', JSON.stringify(templates));
    };

    // --- END TEMPLATES LOGIC ---

    // Helper to prepare form for export
    const prepareForExport = () => {
        // Hide UI elements
        addContactBtn.style.display = 'none';
        calendarTrigger.style.display = 'none';
        document.querySelectorAll('.remove-contact').forEach(btn => btn.style.display = 'none');
        
        // Replace inputs/textareas with spans for perfect rendering
        const inputs = formElement.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            // No saltar nada, ya que el input de fecha está fuera del contenedor


            const span = document.createElement('span');
            span.className = 'export-replacement ' + input.className;
            span.textContent = input.value || input.placeholder || '';
            span.style.display = 'inline-block';
            
            // Mirror styles for layout consistency
            const style = window.getComputedStyle(input);
            span.style.fontFamily = style.fontFamily;
            span.style.fontSize = style.fontSize;
            span.style.fontWeight = style.fontWeight;
            span.style.color = style.color;
            span.style.textAlign = style.textAlign;
            span.style.padding = style.padding;
            
            if (input.tagName === 'TEXTAREA') {
                span.style.whiteSpace = 'pre-wrap';
                span.style.width = '100%';
            } else {
                span.style.minWidth = '20px';
                // For date input specially, keep it tight
                if (input === dateInput) {
                    span.style.minWidth = 'auto';
                }
            }

            input.style.display = 'none';
            input.parentNode.insertBefore(span, input);
        });

        formElement.classList.add('exporting');
    };

    // Helper to restore form after export
    const restoreAfterExport = () => {
        // Show UI elements
        addContactBtn.style.display = 'flex';
        calendarTrigger.style.display = 'inline-block';
        document.querySelectorAll('.remove-contact').forEach(btn => btn.style.display = 'inline-block');
        
        // Remove replacements and show inputs again
        const replacements = formElement.querySelectorAll('.export-replacement');
        replacements.forEach(span => span.remove());
        const inputs = formElement.querySelectorAll('input, textarea');
        inputs.forEach(input => input.style.display = '');

        formElement.classList.remove('exporting');
    };

    // Download PNG
    downloadPngBtn.addEventListener('click', async () => {
        prepareForExport();
        console.log("Iniciando generación de PNG...");
        
        try {
            const canvas = await html2canvas(formElement, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff'
            });
            
            const link = document.createElement('a');
            link.download = `Logistica_Villalba_${new Date().getTime()}.png`;
            link.href = canvas.toDataURL('image/png');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error al generar PNG:', error);
            alert('Error al generar la imagen PNG.');
        } finally {
            restoreAfterExport();
        }
    });

    // Download PDF
    downloadPdfBtn.addEventListener('click', async () => {
        const { jsPDF } = window.jspdf;
        if (!jsPDF) {
            alert('La librería PDF no se ha cargado correctamente.');
            return;
        }
        
        prepareForExport();
        console.log("Iniciando generación de PDF...");

        try {
            const canvas = await html2canvas(formElement, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff'
            });
            
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Logistica_Villalba_${new Date().getTime()}.pdf`);
        } catch (error) {
            console.error('Error al generar PDF:', error);
            alert('Error al generar el archivo PDF.');
        } finally {
            restoreAfterExport();
        }
    });
});
