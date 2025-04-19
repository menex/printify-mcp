=== DETAILED DOCUMENTATION: IMAGES ===

Images are what make your product unique and are applied to different print areas.

KEY POINTS ABOUT IMAGES:
- Images can be uploaded from URLs, local files, or generated with AI
- Each uploaded image gets a unique ID that you'll use when creating a product
- Different blueprints have different available print areas (front, back, etc.)
- Image requirements vary by print provider and blueprint
- Generally, images should be high resolution (300 DPI) and in PNG or JPEG format

## IMAGE GENERATION WITH AI

The system provides powerful AI image generation capabilities with customizable defaults:

### Setting Image Parameters

There are two ways to specify which model and parameters to use:

#### Option 1: Set Default Parameters
Use the `set_default` tool to configure default settings for all future image generations:

```javascript
// Set default model to Ultra for higher quality
set_default({ option: "model", value: "black-forest-labs/flux-1.1-pro-ultra" })

// Set default aspect ratio for all images
set_default({ option: "aspectRatio", value: "16:9" })

// Set default raw parameter (true for more natural photos)
set_default({ option: "raw", value: true })

// Set default negative prompt
set_default({ option: "negativePrompt", value: "low quality, blurry, distorted" })
```

#### Option 2: Override Parameters for Specific Generations
Specify parameters directly in the generation call to override defaults just for that image:

```javascript
generate_and_upload_image({
  prompt: "A vibrant t-shirt design with abstract geometric patterns",
  fileName: "geometric-design.png",
  model: "black-forest-labs/flux-1.1-pro",  // Override default model
  aspectRatio: "1:1",                       // Override default aspect ratio
  raw: false                                // Override default raw setting
})
```

### Viewing Current Default Settings
Use the `get_defaults` tool to see all current default settings:

```javascript
get_defaults()
```

This will show you the currently selected model and a table of all current default settings.

### Generating Images with AI
Once you've set your defaults (or decided to use the system defaults), you can generate images with minimal parameters:

```javascript
// Using all defaults - only prompt and fileName are required
generate_and_upload_image({
  prompt: "A vibrant t-shirt design with abstract geometric patterns",
  fileName: "geometric-design.png"
})
```

## IMAGE UPLOAD METHODS

- The system supports two upload methods:
  1. Direct base64 upload (used when ImgBB API key is not set and for smaller images)
  2. ImgBB URL upload (used when IMGBB_API_KEY environment variable is set)

- IMPORTANT: The ImgBB method is REQUIRED when using the Flux 1.1 Pro Ultra model
  because it generates high-resolution images that are too large for direct base64 upload

- If the ImgBB API key is set, the system will first try to upload to ImgBB to get a URL
- If ImgBB upload fails and the image is small enough, it will automatically fall back to direct base64 upload
- For standard-sized images from the regular Flux 1.1 Pro model, both methods work well

## HOW TO UPLOAD IMAGES

1. From a URL:
   ```javascript
   upload_image({ fileName: "front.png", url: "https://example.com/image.png" })
   ```

2. From a local file:
   ```javascript
   upload_image({ fileName: "front.png", url: "c:\\path\\to\\image.png" })
   ```

3. Generate with AI and upload:
   ```javascript
   generate_and_upload_image({ prompt: "blue t-shirt design", fileName: "front.png" })
   ```

## EXAMPLE IMAGE UPLOAD RESPONSE

```json
{
  "id": "680325163d2a2ac0a2d2937c",
  "file_name": "front.png",
  "width": 1200,
  "height": 1200,
  "preview_url": "https://images.printify.com/mockup/680325163d2a2ac0a2d2937c/12.png"
}
```

## TIPS FOR BETTER AI-GENERATED IMAGES

- **Be specific in your prompts**: Include details about style, colors, composition
- **Use style references**: "in the style of watercolor painting" or "minimalist line art"
- **Specify what you DON'T want**: Use the negativePrompt parameter
- **For product designs**: Use the Ultra model with raw=false (more stylized)
- **For photorealistic images**: Use the Ultra model with raw=true (more natural)
- **For consistent results**: Use the same seed value across related images
- **For better composition**: Set an appropriate aspectRatio for your product area

## HOW TO USE IMAGES WHEN CREATING A PRODUCT

- Include a printAreas object that maps print areas to images
- Each print area needs:
  * position: The position on the product ("front", "back", etc.)
  * imageId: The ID of the uploaded image

```javascript
// Example print areas object for product creation
{
  "front": { "position": "front", "imageId": "680325163d2a2ac0a2d2937c" },
  "back": { "position": "back", "imageId": "680325163d2a2ac0a2d2938d" }
}
```

## NEXT STEP AFTER UPLOADING IMAGES

- Create your product using create_product with all the information you've gathered
- For more details on image generation, see the `how_to_use({ topic: "image_generation" })` documentation
