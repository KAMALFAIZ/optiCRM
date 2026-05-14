"""
Alternative: Use GetObject to attach to an already-open PowerPoint,
or try creating presentation via a VBScript approach.
This version tries EnsureDispatch and different open flags.
"""
import win32com.client
import win32com.client.gencache
import os
import sys
import time

pptx_path = os.path.abspath(r"D:\OptiCRM\pptx_tmp\work_presentation.pptx")
output_dir = os.path.abspath(r"D:\OptiCRM\pptx_tmp\slides")
os.makedirs(output_dir, exist_ok=True)

print(f"Working copy: {pptx_path}")
print(f"File size: {os.path.getsize(pptx_path)} bytes")
print(f"Output dir: {output_dir}")

try:
    # Try GetActiveObject first (attach to running instance)
    try:
        app = win32com.client.GetActiveObject("PowerPoint.Application")
        print("Attached to existing PowerPoint instance")
    except:
        app = win32com.client.Dispatch("PowerPoint.Application")
        print("Created new PowerPoint instance")

    app.Visible = True
    time.sleep(2)  # give it time to initialize

    # Set automation security to low
    try:
        # msoAutomationSecurityLow = 1
        app.AutomationSecurity = 1
        print(f"AutomationSecurity set to 1")
    except Exception as e:
        print(f"Could not set AutomationSecurity: {e}")

    # Disable protected view settings
    try:
        pv = app.ProtectedViewWindows
        print(f"Protected view windows count: {pv.Count}")
    except Exception as e:
        print(f"ProtectedViewWindows: {e}")

    print(f"Attempting to open: {pptx_path}")
    # Try with all parameters explicit
    prs = app.Presentations.Open(
        FileName=pptx_path,
        ReadOnly=0,       # msoFalse = 0
        Untitled=0,       # msoFalse
        WithWindow=-1     # msoTrue = -1
    )

    slide_count = prs.Slides.Count
    print(f"Opened! Slide count: {slide_count}")

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
    import traceback
    traceback.print_exc()
    try:
        prs.Close()
    except:
        pass
    try:
        app.Quit()
    except:
        pass
    sys.exit(1)
