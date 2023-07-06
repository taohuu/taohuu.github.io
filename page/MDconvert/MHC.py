import markdown
from tkinter import Tk, Text, Button, filedialog, messagebox, ttk
import webbrowser
import ctypes

# 设置高DPI感知
ctypes.windll.shcore.SetProcessDpiAwareness(1)


# 创建主窗口
window = Tk()
window.title("Markdown to HTML Converter")

# 设置字体和字体大小
font = ("Segoe UI", 12)
window.option_add("*Font", font)

# Markdown编辑界面
markdown_editor = Text(window, wrap="word")
markdown_editor.grid(row=0, column=0, sticky="nsew")

# HTML界面
html_editor = Text(window, wrap="word")
html_editor.grid(row=0, column=1, sticky="nsew")

# 创建打开文件按钮
open_button = ttk.Button(window, text="Open", command=lambda: open_file())
open_button.grid(row=1, column=0, padx=10, pady=5)

# 创建转换按钮
convert_button = ttk.Button(window, text="Convert", command=lambda: convert_to_html())
convert_button.grid(row=1, column=1, padx=10, pady=5)

# 创建导出按钮
export_button = ttk.Button(window, text="Export", command=lambda: export_html())
export_button.grid(row=1, column=2, padx=10, pady=5)

# 设置行和列的权重，使其可以自由调整大小
window.grid_rowconfigure(0, weight=1)
window.grid_columnconfigure(0, weight=1)
window.grid_columnconfigure(1, weight=1)

def open_file():
    filepath = filedialog.askopenfilename(filetypes=[("Markdown Files", "*.md")])
    if filepath:
        with open(filepath, "r", encoding="utf-8") as file:
            markdown_editor.delete("1.0", "end")
            markdown_editor.insert("1.0", file.read())

def convert_to_html():
    markdown_text = markdown_editor.get("1.0", "end")
    html_text = markdown.markdown(markdown_text)
    html = create_html_structure(html_text)
    html_editor.delete("1.0", "end")
    html_editor.insert("1.0", html)

def create_html_structure(body_content):
    template = f"""
    <!DOCTYPE html>
    <html lang="zh">
    <head>
        <meta charset="UTF-8">
        <title>网站标题</title>
        <link rel="stylesheet" href="../css/mdConvert.css">
        <link rel="stylesheet" href="https://henryxu.netlify.app/css/mdConvert.css">
        <link rel="stylesheet"  href="https://henryxu.netlify.app/jsp/highlight/styles/vs.min.css"/>
        <script src="https://henryxu.netlify.app/jsp/highlight//highlight.min.js"></script>
        <script>hljs.highlightAll();</script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
    </head>
    <body>
        <div class="container">
        {body_content}
        </div>
    </body>
    </html>
    """
    return template

def export_html():
    html_text = html_editor.get("1.0", "end")
    filepath = filedialog.asksaveasfilename(defaultextension=".html", filetypes=[("HTML Files", "*.html")])
    if filepath:
        with open(filepath, "w", encoding="utf-8") as file:
            file.write(html_text)
        messagebox.showinfo("Export Complete", "HTML file exported successfully.")
        webbrowser.open(filepath)

# 运行主循环
window.mainloop()
