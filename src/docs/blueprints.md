=== DETAILED DOCUMENTATION: BLUEPRINTS ===

Blueprints are the base product templates in Printify (t-shirts, mugs, posters, etc.).

KEY POINTS ABOUT BLUEPRINTS:
- Each blueprint has a unique ID and represents a product type
- Different blueprints have different available print areas (front, back, etc.)
- Not all print providers offer all blueprints
- Blueprints determine what kind of product you're creating

HOW TO GET BLUEPRINTS:
- Use get_blueprints() to see all available blueprints
- The response includes an array of blueprint objects
- Each blueprint has an ID, title, and other properties

EXAMPLE BLUEPRINT OBJECT:
{
  "id": 12,
  "title": "Unisex Jersey Short Sleeve Tee",
  "description": "A comfortable unisex t-shirt",
  "brand": "Bella+Canvas",
  "model": "3001"
}

NEXT STEP AFTER CHOOSING A BLUEPRINT:
- Use get_print_providers({ blueprintId: "12" }) to see which print providers can produce this blueprint
