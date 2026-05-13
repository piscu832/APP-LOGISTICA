document.addEventListener('DOMContentLoaded', () => {
    const addContactBtn = document.getElementById('add-contact');
    const extraContactsContainer = document.getElementById('extra-contacts');
    const downloadPngBtn = document.getElementById('download-png');
    const downloadPdfBtn = document.getElementById('download-pdf');
    const formElement = document.getElementById('form-to-export');
    
    // Calendar elements
    const calendarTrigger = document.getElementById('calendar-trigger');
    const hiddenDatePicker = document.getElementById('hidden-date-picker');
    const dateInput = document.getElementById('date-input');

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
        }
    });

    // Handle adding extra contacts
    addContactBtn.addEventListener('click', () => {
        const contactDiv = document.createElement('div');
        contactDiv.className = 'contact-item';
        contactDiv.innerHTML = `
            <span class="bullet">-</span>
            <input type="text" placeholder="Nuevo contacto..." class="editable-field">
            <button class="remove-contact" style="background:none; border:none; color:red; cursor:pointer; font-size:12px; margin-left:5px;">×</button>
        `;
        extraContactsContainer.appendChild(contactDiv);

        contactDiv.querySelector('.remove-contact').addEventListener('click', () => {
            contactDiv.remove();
        });
    });

    // Helper to prepare form for export
    const prepareForExport = () => {
        // Hide UI elements
        addContactBtn.style.visibility = 'hidden';
        calendarTrigger.style.visibility = 'hidden';
        document.querySelectorAll('.remove-contact').forEach(btn => btn.style.visibility = 'hidden');
        
        // Replace inputs/textareas with spans for perfect rendering
        const inputs = formElement.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            if (input === hiddenDatePicker) return; // Skip the hidden picker

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
        addContactBtn.style.visibility = 'visible';
        calendarTrigger.style.visibility = 'visible';
        document.querySelectorAll('.remove-contact').forEach(btn => btn.style.visibility = 'visible');
        
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
