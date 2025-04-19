=== DETAILED DOCUMENTATION: IMAGE GENERATION ===

## DEFAULT SETTINGS MANAGEMENT

### Viewing Current Defaults
Use the `get_defaults` tool to see all current default settings:

```javascript
get_defaults()
```

This will show you the currently selected model and a table of all current default settings.

EXAMPLE RESPONSE:
```
# Current Default Settings

## Selected Model

## Flux 1.1 Pro Ultra ✓ SELECTED
- ID: `black-forest-labs/flux-1.1-pro-ultra`
- Description: High resolution image generation (up to 4MP) with raw mode option
- Capabilities: raw_mode, high_resolution, image_prompt_strength
- Status: **Currently selected as default model**

## All Default Parameters

| Option | Value |
|--------|-------|
| model | black-forest-labs/flux-1.1-pro-ultra |
| width | 1024 |
| height | 1024 |
| aspectRatio | 16:9 |
| outputFormat | png |
| numInferenceSteps | 25 |
| guidanceScale | 7.5 |
| negativePrompt | low quality, bad quality, sketches |
| safetyTolerance | 2 |
| raw | false |
| promptUpsampling | true |
| outputQuality | 90 |
```

### Setting Default Parameters
Use the `set_default` tool to change any default parameter. These settings will be used by default for all future image generation requests unless overridden in the specific tool call.

```javascript
// Set default model
set_default({ option: "model", value: "black-forest-labs/flux-1.1-pro-ultra" })

// Set default aspect ratio
set_default({ option: "aspectRatio", value: "16:9" })

// Set default raw parameter
set_default({ option: "raw", value: false })

// Set default guidance scale
set_default({ option: "guidanceScale", value: 8.5 })

// Set default negative prompt
set_default({ option: "negativePrompt", value: "low quality, blurry, distorted" })
```

The response will show the updated setting and a table of all current defaults:

```
# Default Setting Updated

Successfully set default `aspectRatio` to: `16:9`

## Current Default Settings

| Option | Value |
|--------|-------|
| model | black-forest-labs/flux-1.1-pro-ultra |
| width | 1024 |
| height | 1024 |
| aspectRatio | 16:9 |
| outputFormat | png |
...
```

### Available Default Options

You can set defaults for any of these parameters:

| Option | Type | Description | Example Value |
|--------|------|-------------|---------------|
| model | string | Model ID to use | "black-forest-labs/flux-1.1-pro-ultra" |
| aspectRatio | string | Aspect ratio in width:height format | "16:9" |
| width | number | Image width in pixels | 1024 |
| height | number | Image height in pixels | 1024 |
| outputFormat | string | Image format (png, jpeg, webp) | "png" |
| numInferenceSteps | number | Number of inference steps | 25 |
| guidanceScale | number | Guidance scale (1-20) | 7.5 |
| negativePrompt | string | Negative prompt text | "low quality, blurry" |
| safetyTolerance | number | Safety tolerance (0-6) | 2 |
| raw | boolean | Raw mode for Ultra model | false |
| promptUpsampling | boolean | Prompt upsampling for Pro model | true |
| outputQuality | number | Output quality for Pro model | 90 |

### Two Ways to Set the Model

There are two ways to specify which model to use:

1. **Set the default model** for all future generations:
   ```javascript
   set_default({ option: "model", value: "black-forest-labs/flux-1.1-pro-ultra" })
   ```

2. **Override the model for a specific generation**:
   ```javascript
   generate_and_upload_image({
     prompt: "A beautiful mountain landscape",
     fileName: "mountain.png",
     model: "black-forest-labs/flux-1.1-pro"  // Override just for this generation
   })
   ```

## AVAILABLE IMAGE GENERATION TOOLS

This MCP provides two different tools for image generation:

### 1. Generate and Upload to Printify
The `generate_and_upload_image` tool generates an image and uploads it to Printify:

```javascript
generate_and_upload_image({
  prompt: "A beautiful mountain landscape",
  fileName: "mountain.png"
  // All other parameters use the defaults
})
```

### 2. Generate to Local File
The `generate_image` tool generates an image and saves it to a local file without uploading to Printify:

```javascript
generate_image({
  prompt: "A beautiful mountain landscape",
  outputPath: "c:\\path\\to\\mountain.png"  // Full path where to save the image
  // All other parameters use the defaults
})
```

### Overriding Default Parameters
You can override any default parameter for a specific generation:

```javascript
generate_and_upload_image({
  prompt: "A beautiful mountain landscape",
  fileName: "mountain.png",
  // Override defaults for this generation only
  model: "black-forest-labs/flux-1.1-pro",
  aspectRatio: "4:3",
  guidanceScale: 8.0,
  raw: true
})
```

## MODEL-SPECIFIC PARAMETERS

### Flux 1.1 Pro Parameters
- `promptUpsampling`: Enable prompt upsampling (default: true)
- `outputQuality`: Output quality 1-100 (default: 90)

EXAMPLE:
```javascript
// Option 1: Set the default model to Pro for all future generations
set_default({ option: "model", value: "black-forest-labs/flux-1.1-pro" })

// Then generate with Pro-specific parameters
generate_and_upload_image({
  prompt: "A beautiful mountain landscape",
  fileName: "mountain.png",
  promptUpsampling: true,
  outputQuality: 95
})

// Option 2: Override the model just for this specific generation
generate_and_upload_image({
  prompt: "A beautiful mountain landscape",
  fileName: "mountain.png",
  model: "black-forest-labs/flux-1.1-pro",  // Override default model
  promptUpsampling: true,
  outputQuality: 95
})
```

### Flux 1.1 Pro Ultra Parameters
- `raw`: Generate less processed, more natural-looking images (default: false)
- `imagePromptStrength`: Image prompt strength 0-1

EXAMPLE:
```javascript
// Option 1: Set the default model to Ultra for all future generations
set_default({ option: "model", value: "black-forest-labs/flux-1.1-pro-ultra" })

// Then generate with Ultra-specific parameters
generate_and_upload_image({
  prompt: "A beautiful mountain landscape",
  fileName: "mountain.png",
  raw: true,  // Override the default (false) to get more natural-looking images
  imagePromptStrength: 0.8
})

// Option 2: Override the model just for this specific generation
generate_and_upload_image({
  prompt: "A beautiful mountain landscape",
  fileName: "mountain.png",
  model: "black-forest-labs/flux-1.1-pro-ultra",  // Override default model
  raw: true,
  imagePromptStrength: 0.8
})
```

## COMMON PARAMETERS (WORK WITH ALL MODELS)

These parameters work with both models and can be set as defaults or overridden per generation:

| Parameter | Description | Default |
|-----------|-------------|--------|
| prompt | Text prompt for image generation | REQUIRED |
| fileName/outputPath | Output filename or path | REQUIRED |
| aspectRatio | Aspect ratio (e.g., '16:9', '4:3', '1:1') | "16:9" |
| width/height | Image dimensions in pixels | 1024x1024 |
| outputFormat | Output format (jpeg, png, webp) | "png" |
| safetyTolerance | Safety tolerance (0-6) | 2 |
| seed | Random seed for reproducible generation | random |
| numInferenceSteps | Number of inference steps | 25 |
| guidanceScale | Guidance scale | 7.5 |
| negativePrompt | Negative prompt | "low quality, bad quality, sketches" |

## IMAGE UPLOAD PROCESS

The generate_and_upload_image tool uses a two-step process:

1. First, it generates the image using the Replicate API based on your prompt
2. Then, it uploads the image to Printify using one of two methods:

   a. **ImgBB URL Method** (if IMGBB_API_KEY is set):
      - The image is first uploaded to ImgBB to get a public URL
      - Then that URL is provided to Printify
      - This method supports larger file sizes and provides better caching
      - **REQUIRED for Flux 1.1 Pro Ultra model due to larger file sizes**

   b. **Direct Base64 Method** (used when ImgBB API key is not set):
      - The image is uploaded directly to Printify as base64 data
      - No third-party service is required
      - Only works with smaller images from the standard Flux 1.1 Pro model
      - Will fail with high-resolution images from the Ultra model

   IMPORTANT ENVIRONMENT SETUP:
   - When using the Ultra model, you MUST set the IMGBB_API_KEY environment variable
   - Get a free API key from https://api.imgbb.com/
   - Add it to your .env file: IMGBB_API_KEY=your_api_key_here

## WORKFLOW EXAMPLES

### Example 1: Setting Defaults Once and Generating Multiple Images

```javascript
// Set up your preferred defaults at the beginning of your session
set_default({ option: "model", value: "black-forest-labs/flux-1.1-pro-ultra" })  // Set default model
set_default({ option: "aspectRatio", value: "16:9" })
set_default({ option: "raw", value: true })
set_default({ option: "guidanceScale", value: 8.0 })

// Now generate multiple images with minimal parameters
const frontImage = await generate_and_upload_image({
  prompt: "A futuristic cityscape with neon lights and tall skyscrapers",
  fileName: "cityscape-front.png"
})

const backImage = await generate_and_upload_image({
  prompt: "A minimalist futuristic logo with geometric shapes",
  fileName: "logo-back.png"
})
```

### Example 2: Generating Image Variations with Different Seeds

```javascript
// Option 1: Set defaults first
set_default({ option: "model", value: "black-forest-labs/flux-1.1-pro-ultra" })  // Set default model
set_default({ option: "aspectRatio", value: "1:1" })

// Option 2: You could also override the model in each generation call instead

// Generate variations of the same image with different seeds
const variation1 = await generate_and_upload_image({
  prompt: "A majestic lion with a flowing mane against a sunset",
  fileName: "lion-variation-1.png",
  seed: 12345
})

const variation2 = await generate_and_upload_image({
  prompt: "A majestic lion with a flowing mane against a sunset",
  fileName: "lion-variation-2.png",
  seed: 67890
})
```

## TIPS FOR BEST RESULTS

- **For Photorealistic Images**: Use the Ultra model with `raw: true`
- **For Illustrations/Art**: Use the Ultra model with `raw: false` (default)
- **For Smaller File Sizes**: Use the Pro model with default settings
- **For Consistent Results**: Use the same `seed` value across generations
- **For More Control**: Adjust `guidanceScale` (higher = more literal interpretation)
- **For Better Prompts**:
  - Be specific about style, lighting, composition, and details
  - Include artist references (e.g., "in the style of...")
  - Specify what you DON'T want in the `negativePrompt`

## TROUBLESHOOTING

- **Ultra Model Errors**: Make sure IMGBB_API_KEY is set in your environment
- **Poor Image Quality**: Try increasing `numInferenceSteps` to 30-50
- **Too Much/Little Detail**: Adjust `guidanceScale` up or down
- **Inconsistent Results**: Use a fixed `seed` value
- **Wrong Aspect Ratio**: Set `aspectRatio` explicitly rather than using width/height
