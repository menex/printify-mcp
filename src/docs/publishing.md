=== DETAILED DOCUMENTATION: PUBLISHING PRODUCTS ===

After creating a product, you may need to publish it depending on your sales channel.

KEY POINTS ABOUT PUBLISHING:

1. FOR POP-UP STORES:
   - Products created in Printify are automatically added to your Pop-Up Store catalog
   - You DON'T need to explicitly "publish" them using the publish_product API endpoint
   - The publish_product API endpoint is designed for external sales channels like Shopify or Etsy
   - To make variants available for purchase, ensure they have "isEnabled": true and a price set

2. FOR EXTERNAL SALES CHANNELS (Shopify, Etsy, etc.):
   - After creating a product, you need to publish it to your connected sales channel
   - Use the publish_product endpoint with the product ID:
     publish_product({ productId: "your-product-id" })
   - You can control which aspects of the product to publish:
     publish_product({
       productId: "your-product-id",
       publishDetails: {
         title: true,
         description: true,
         images: true,
         variants: true,
         tags: true
       }
     })

3. VISIBILITY IN POP-UP STORE:
   - Products may take a few minutes to appear in your Pop-Up Store
   - If a product doesn't appear, check that:
     a) The variants are enabled (isEnabled: true)
     b) The variants have prices set
     c) The product has images assigned to print areas

4. MANAGING PRODUCTS:
   - Update a product: update_product({ productId: "your-product-id", ... })
   - Delete a product: delete_product({ productId: "your-product-id" })
   - Get product details: get_product({ productId: "your-product-id" })

Your Pop-Up Store URL is typically: [your-shop-name].printify.me
