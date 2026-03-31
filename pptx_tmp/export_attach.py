"""
Attach to the already-open PowerPoint instance and export slides.
"""
import win32com.client
import os
import sys
import time

output_dir = os.path.abspath(r"D:\OptiCRM\pptx_tmp\slides")
os.makedirs(output_dir, exist_ok=True)

print(f"Output dir: {output_dir}")

try:
    # Attach to the running PowerPoint instance
    app = win32com.client.GetActiveObject("PowerPoint.Application")
    print(f"Attached to running PowerPoint. Presentations open: {app.Presentations.Count}")

    # Get the presentation (should be the first/only one)
    prs = app.Presentations(1)
    print(f"Presentation: {prs.Name}")
    slide_count = prs.Slides.Count
    print(f"Slide count: {slide_count}")

    for i in range(1, slide_count + 1):
        slide = prs.Slides(i)
        out_path = os.path.join(output_dir, f"slide-{i:02d}.jpg")
        slide.Export(out_path, "JPG", 1440, 810)
        print(f"  Exported slide {i:02d} -> {out_path}")
        sys.stdout.flush()

    print("Export complete. Closing presentation...")
    prs.Close()
    app.Quit()
    print("Done.")

except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc(file=sys.stderr)
    sys.exit(1)
