import base64

svg_path = r"a:\PROYECTOS ANTIGRAVITY\APP LOGÍSTICA\assets\logo.svg"
with open(svg_path, "rb") as image_file:
    encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
    print(f"data:image/svg+xml;base64,{encoded_string}")
