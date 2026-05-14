import win32com.client
import os
import sys
import shutil

# Copy PPTX to the working temp dir to avoid protected-view issues
src_path = r"D:\OptiCRM\OptiCRM_Flux_Modules.pptx"
work_dir = r"D:\OptiCRM\pptx_tmp"
local_copy = os.path.join(work_dir, "work_presentation.pptx")
output_dir = os.path.join(work_dir, "slides")
os.makedirs(output_dir, exist_ok=True)

shutil.copy2(src_path, local_copy)
pptx_path = os.path.abspath(local_copy)

print(f"Working copy: {pptx_path}")
print(f"Exists: {os.path.isfile(pptx_path)}")
print(f"Output dir: {output_dir}")

try:
    app = win32com.client.Dispatch("PowerPoint.Application")
    app.Visible = True

    # Disable protected view for local files
    try:
        app.AutomationSecurity = 1  # msoAutomationSecurityLow
    except:
        pass

    prs = app.Presentations.Open(
        pptx_path,
        ReadOnly=False,      # open as editable to bypass some protected-view triggers
        Untitled=False,
        WithWindow=True
    )

    slide_count = prs.Slides.Count
    print(f"Slide count: {slide_count}")

    for i in range(1, slide_count + 1):
        slide = prs.Slides(i)
        out_path = os.path.join(output_dir, f"slide-{i:02d}.jpg")
        slide.Export(out_path, "JPG", 1440, 810)
        print(f"  Exported slide {i:02d} -> {out_path}")

    prs.Close()
    app.Quit()
    print("Done.")

except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    try:
        prs.Close()
    except:
        pass
    try:
        app.Quit()
    except:
        pass
    sys.exit(1)
