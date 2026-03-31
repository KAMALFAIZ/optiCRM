Dim pptxPath, outputDir, app, prs, slide, i, outPath

pptxPath = "D:\OptiCRM\pptx_tmp\work_presentation.pptx"
outputDir = "D:\OptiCRM\pptx_tmp\slides"

Set app = CreateObject("PowerPoint.Application")
app.Visible = True

Set prs = app.Presentations.Open(pptxPath, False, False, True)

WScript.Echo "Slide count: " & prs.Slides.Count

For i = 1 To prs.Slides.Count
    outPath = outputDir & "\slide-" & Right("0" & i, 2) & ".jpg"
    prs.Slides(i).Export outPath, "JPG", 1440, 810
    WScript.Echo "Exported slide " & i & " -> " & outPath
Next

prs.Close
app.Quit

WScript.Echo "Done."
