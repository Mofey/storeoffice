export interface MockCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface MockProduct {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
}

const mockCategories: MockCategory[] = [
  { id: 'phones', name: 'Phones', icon: 'Phone', description: 'Flagship smartphones, foldables, and creator-friendly mobile devices.' },
  { id: 'laptops', name: 'Laptops', icon: 'Laptop', description: 'Performance laptops for work, gaming, design, and hybrid productivity.' },
  { id: 'audio', name: 'Audio', icon: 'Headphones', description: 'Headphones, speakers, and immersive sound gear for every mood.' },
  { id: 'wearables', name: 'Wearables', icon: 'Watch', description: 'Smartwatches and fitness wearables that blend utility with style.' },
  { id: 'gaming', name: 'Gaming', icon: 'Gamepad2', description: 'Consoles, accessories, and elite gear built for competitive play.' },
  { id: 'home', name: 'Smart Home', icon: 'Home', description: 'Connected home tech designed for comfort, automation, and control.' },
  { id: 'fashion', name: 'Fashion', icon: 'Shirt', description: 'Modern essentials, premium layers, and statement pieces for daily wear.' },
  { id: 'beauty', name: 'Beauty', icon: 'Sparkles', description: 'Beauty and wellness products curated for self-care routines.' },
  { id: 'fitness', name: 'Fitness', icon: 'Dumbbell', description: 'Home workout gear and recovery tools for active lifestyles.' },
  { id: 'books', name: 'Books', icon: 'BookOpen', description: 'Business, design, fiction, and learning titles worth revisiting.' },
];

const mockProducts: MockProduct[] = [
  { id: 101, name: 'Nova X Pro', price: 999, image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80', category: 'phones', description: 'A flagship phone with an edge-to-edge OLED display, pro-grade camera stack, and all-day battery confidence.', rating: 4.8, reviews: 1284, inStock: true, isFeatured: true, isNewArrival: true },
  { id: 102, name: 'Orbit Flip Air', price: 849, image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=80', category: 'phones', description: 'Compact foldable design with a premium hinge, bright cover screen, and creator-focused portrait tools.', rating: 4.6, reviews: 846, inStock: true, isFeatured: true },
  { id: 103, name: 'PixelTone Mini', price: 479, image: 'https://images.unsplash.com/photo-1567581935884-3349723552ca?auto=format&fit=crop&w=900&q=80', category: 'phones', description: 'A clean Android experience packed into a compact handset with dependable cameras and snappy performance.', rating: 4.5, reviews: 593, inStock: true },
  { id: 104, name: 'Volt Max Ultra', price: 1199, image: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=900&q=80', category: 'phones', description: 'A power-user smartphone tuned for gaming, shooting in 8K, and rapid charging when every minute matters.', rating: 4.7, reviews: 932, inStock: false, isFeatured: true },
  { id: 201, name: 'AeroBook Studio 14', price: 1599, image: 'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=900&q=80', category: 'laptops', description: 'A creator-first ultrabook with a vivid display, quiet cooling, and enough horsepower for heavy multitasking.', rating: 4.8, reviews: 714, inStock: true, isFeatured: true, isNewArrival: true },
  { id: 202, name: 'Summit Workstation 16', price: 1899, image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80', category: 'laptops', description: 'A large-format performance laptop built for rendering, coding sprints, and data-heavy workflows.', rating: 4.7, reviews: 522, inStock: true },
  { id: 203, name: 'CloudLite Everyday', price: 799, image: 'https://images.unsplash.com/photo-1484788984921-03950022c9ef?auto=format&fit=crop&w=900&q=80', category: 'laptops', description: 'Portable, affordable, and polished for students, remote teams, and anyone who values battery life.', rating: 4.4, reviews: 1108, inStock: true, isNewArrival: true },
  { id: 204, name: 'Titan Gaming Deck', price: 2099, image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=900&q=80', category: 'laptops', description: 'A gaming laptop with high-refresh visuals, premium thermals, and desktop-class responsiveness.', rating: 4.8, reviews: 688, inStock: true, isFeatured: true },
  { id: 301, name: 'EchoWave ANC Headphones', price: 329, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80', category: 'audio', description: 'Adaptive noise cancelling, rich spatial sound, and a soft-fit design for long listening sessions.', rating: 4.7, reviews: 2014, inStock: true, isFeatured: true },
  { id: 302, name: 'Pulse Pods S', price: 149, image: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=900&q=80', category: 'audio', description: 'Pocket-sized earbuds with punchy sound, instant pairing, and dependable call clarity.', rating: 4.5, reviews: 1672, inStock: true, isNewArrival: true },
  { id: 303, name: 'RoomBeat Speaker One', price: 219, image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80', category: 'audio', description: 'A sculptural wireless speaker with room-filling sound and deep low-end warmth.', rating: 4.6, reviews: 431, inStock: true },
  { id: 401, name: 'Halo Watch Gen 4', price: 399, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80', category: 'wearables', description: 'A polished smartwatch with sleep tracking, workout coaching, and premium wrist presence.', rating: 4.6, reviews: 977, inStock: true, isFeatured: true },
  { id: 402, name: 'Motion Band Active', price: 119, image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=900&q=80', category: 'wearables', description: 'Slim, lightweight, and ideal for step goals, recovery metrics, and everyday reminders.', rating: 4.3, reviews: 620, inStock: true },
  { id: 501, name: 'ArcStation Console', price: 499, image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=900&q=80', category: 'gaming', description: 'A sleek next-gen console with fast load times, smooth 4K play, and premium controller feedback.', rating: 4.9, reviews: 2456, inStock: true, isFeatured: true, isNewArrival: true },
  { id: 502, name: 'Phantom Elite Controller', price: 179, image: 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?auto=format&fit=crop&w=900&q=80', category: 'gaming', description: 'Customizable back paddles, textured grips, and tournament-ready wireless performance.', rating: 4.7, reviews: 801, inStock: true },
  { id: 601, name: 'NestGlow Ambient Lamp', price: 89, image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80', category: 'home', description: 'A smart ambient lamp with app-controlled scenes that elevate bedrooms, desks, and lounges.', rating: 4.4, reviews: 359, inStock: true, isNewArrival: true },
  { id: 602, name: 'Breeze Home Purifier', price: 269, image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=900&q=80', category: 'home', description: 'Quiet air purification with smart monitoring and a minimalist design that blends into modern spaces.', rating: 4.5, reviews: 507, inStock: true },
  { id: 701, name: 'Axis Overshirt', price: 98, image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80', category: 'fashion', description: 'A versatile heavyweight overshirt tailored for layering through office hours and weekends alike.', rating: 4.6, reviews: 286, inStock: true, isFeatured: true },
  { id: 702, name: 'Urban Drift Sneakers', price: 140, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80', category: 'fashion', description: 'Street-ready sneakers with cloud-soft cushioning and an understated premium silhouette.', rating: 4.7, reviews: 1043, inStock: true, isNewArrival: true },
  { id: 801, name: 'Luma Skin Ritual Set', price: 76, image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80', category: 'beauty', description: 'A four-step hydration and glow routine designed for fast mornings and calm evenings.', rating: 4.5, reviews: 392, inStock: true },
  { id: 802, name: 'Velvet Mist Fragrance', price: 129, image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=80', category: 'beauty', description: 'A warm, modern fragrance with notes of pear, sandalwood, and a clean floral finish.', rating: 4.8, reviews: 214, inStock: false, isFeatured: true },
  { id: 901, name: 'CoreFlex Adjustable Dumbbells', price: 349, image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80', category: 'fitness', description: 'Space-saving adjustable dumbbells for serious strength training at home.', rating: 4.8, reviews: 566, inStock: true, isFeatured: true },
  { id: 902, name: 'Recovery Pro Massage Gun', price: 189, image: 'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?auto=format&fit=crop&w=900&q=80', category: 'fitness', description: 'Targeted muscle recovery with multiple heads, quiet operation, and travel-ready portability.', rating: 4.6, reviews: 481, inStock: true },
  { id: 1001, name: 'Designing Better Products', price: 34, image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80', category: 'books', description: 'A modern product thinking guide covering discovery, storytelling, execution, and customer empathy.', rating: 4.9, reviews: 173, inStock: true, isNewArrival: true },
  { id: 1002, name: 'The Focused Founder', price: 28, image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80', category: 'books', description: 'A practical read on building momentum, simplifying decisions, and scaling with intention.', rating: 4.7, reviews: 129, inStock: true },
];

export const getMockCategories = (): MockCategory[] => mockCategories.map((category) => ({ ...category }));

export const getMockProducts = (): MockProduct[] => mockProducts.map((product) => ({ ...product }));
