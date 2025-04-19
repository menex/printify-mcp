=== DETAILED DOCUMENTATION: VARIANTS ===

Variants are the specific product options available for a blueprint from a specific print provider.

KEY POINTS ABOUT VARIANTS:
- Variants typically include combinations of colors, sizes, and other attributes
- Each variant has a unique ID that you'll need when creating a product
- Variants have a cost (what you pay to the print provider)
- You set a retail price for each variant (what your customers will pay)
- You can enable or disable specific variants

HOW TO GET VARIANTS:
- First choose a blueprint ID and print provider ID
- Then use get_variants({ blueprintId: "12", printProviderId: "29" })
- The response includes an array of variant objects
- Each variant has an ID, title, options, and cost

EXAMPLE VARIANT OBJECT:
{
  "id": 18100,
  "title": "Black / S",
  "options": {
    "color": "Black",
    "size": "S"
  },
  "cost": 1992  // $19.92 - what you pay to the print provider
}

HOW TO USE VARIANTS WHEN CREATING A PRODUCT:
- Include an array of variant objects with your pricing
- Each variant object needs:
  * variantId: The ID of the variant
  * price: The retail price in cents (e.g., 2499 for $24.99)
  * isEnabled: (Optional) Whether the variant is enabled (defaults to true)

EXAMPLE VARIANTS ARRAY FOR PRODUCT CREATION:
[
  { "variantId": 18100, "price": 2499 },  // Black / S for $24.99
  { "variantId": 18101, "price": 2499 },  // Black / M for $24.99
  { "variantId": 18102, "price": 2499 }   // Black / L for $24.99
]

NEXT STEP AFTER CHOOSING VARIANTS:
- Upload images for your product using upload_image or generate_and_upload_image
