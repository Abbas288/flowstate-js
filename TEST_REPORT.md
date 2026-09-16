# Test Report

<!--
    Commit this file to the root of your GitHub repository, alongside your module's code.
-->

## Summary

*Briefly describe how you tested your module, and why you chose that approach — clearly enough
that someone else could carry out the same tests.*

Answer:

## Test Results

**Example** (shows what a filled-in row can look like — remove this example table before
submitting):

| What was tested                                                        | How it was tested                                                                                                       | Result                                                                       |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `Jpeg.load(path)` returns a `Picture` instance for a valid image file. | Automated unit test (Vitest): loaded `test-image.jpg` and checked that the return value had `getHeight()`/`getWidth()` methods. | ✅ Passed.                                                                    |
| `Picture.getPixelAt(x, y)` with coordinates outside the image.         | Manual test via the Test-App's interface: entered a coordinate pair larger than the image's width/height and observed the output. | ❌ Didn't throw an error initially — fixed, now throws a clear exception. |

**Your test results:**

| What was tested | How it was tested | Result |
| ---------------- | ------------------ | ------- |
|                   |                    |         |
|                   |                    |         |
|                   |                    |         |
|                   |                    |         |
|                   |                    |         |
