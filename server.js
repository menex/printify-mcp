import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static('public'));

// API routes for Printify integration
app.use(express.json());

// Mock API endpoints for demonstration
app.get('/api/products', (req, res) => {
    // In a real implementation, this would use the Printify MCP client
    const mockProducts = [
        {
            id: '1',
            title: 'Awesome T-Shirt Design',
            description: 'A beautiful t-shirt with an amazing design that customers will love.',
            blueprint_id: 12,
            print_provider_id: 29,
            visible: true,
            is_locked: false,
            created_at: '2024-01-15T10:30:00Z',
            images: [
                { id: '1', src: 'https://images.pexels.com/photos/1020585/pexels-photo-1020585.jpeg?auto=compress&cs=tinysrgb&w=400', alt: 'Front design' }
            ],
            variants: [
                { id: 1, title: 'Black / S', price: 2499 },
                { id: 2, title: 'Black / M', price: 2499 },
                { id: 3, title: 'Black / L', price: 2499 }
            ]
        },
        {
            id: '2',
            title: 'Cool Mug Design',
            description: 'Perfect for coffee lovers with a unique artistic design.',
            blueprint_id: 15,
            print_provider_id: 30,
            visible: false,
            is_locked: false,
            created_at: '2024-01-14T15:45:00Z',
            images: [
                { id: '2', src: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=400', alt: 'Mug design' }
            ],
            variants: [
                { id: 4, title: 'White / 11oz', price: 1599 }
            ]
        }
    ];
    
    res.json(mockProducts);
});

app.get('/api/shops', (req, res) => {
    const mockShops = [
        {
            id: 1,
            title: 'My Awesome Store',
            sales_channel: 'custom_integration'
        }
    ];
    
    res.json(mockShops);
});

app.get('/api/status', (req, res) => {
    res.json({
        connected: true,
        currentShop: {
            id: 1,
            title: 'My Awesome Store',
            sales_channel: 'custom_integration'
        }
    });
});

// Catch all handler: send back React's index.html file
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Printify Product Manager running on http://localhost:${PORT}`);
});