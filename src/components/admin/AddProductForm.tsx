import React, { useState } from 'react';
import { X, Save, Star } from 'lucide-react';
import { useProducts } from '../../contexts/ProductContext';

interface AddProductFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddProductForm: React.FC<AddProductFormProps> = ({ isOpen, onClose }) => {
  const { addProduct, categories } = useProducts();
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    image: '',
    category: 'phones',
    description: '',
    rating: 4.5,
    reviews: 0,
    stockQuantity: 10,
    inStock: true,
    isFeatured: false,
    isNewArrival: false
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addProduct({ ...formData, inStock: formData.stockQuantity > 0 });
    onClose();
    // Reset form
    setFormData({
      name: '',
      price: 0,
      image: '',
      category: 'phones',
      description: '',
      rating: 4.5,
      reviews: 0,
      stockQuantity: 10,
      inStock: true,
      isFeatured: false,
      isNewArrival: false
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const categoryOptions = categories.length > 0 ? categories : [{ id: 'phones', name: 'Phones', icon: '', description: '' }];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white dark:bg-gray-800"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Add New Product
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                required
                placeholder="Enter product name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price ($) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                required
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                required
              >
                {categoryOptions.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Initial Rating
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  name="rating"
                  value={formData.rating}
                  onChange={handleInputChange}
                  className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                  min="0"
                  max="5"
                  step="0.1"
                />
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(formData.rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Initial Review Count
              </label>
              <input
                type="number"
                name="reviews"
                value={formData.reviews}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                min="0"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Stock Quantity
              </label>
              <input
                type="number"
                name="stockQuantity"
                value={formData.stockQuantity}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                min="0"
                placeholder="0"
              />
            </div>
          </div>

          {/* Product Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Product Image URL *
            </label>
            <div className="space-y-3">
              <input
                type="url"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                required
              />
              {formData.image && (
                <div className="mt-3">
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/128x128?text=Invalid+URL';
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Product Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Product Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
              required
              placeholder="Enter detailed product description..."
            />
          </div>

          {/* Product Status and Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="inStock"
                name="inStock"
                checked={formData.stockQuantity > 0}
                disabled
                onChange={handleCheckboxChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="inStock" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                In Stock (auto)
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isFeatured"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleCheckboxChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isFeatured" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Featured Product
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isNewArrival"
                name="isNewArrival"
                checked={formData.isNewArrival}
                onChange={handleCheckboxChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isNewArrival" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                New Arrival
              </label>
            </div>
          </div>

          {/* Feature Explanations */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              Product Display Options:
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• <strong>Featured Product:</strong> Will appear in the "Featured Products" section on the homepage</li>
              <li>• <strong>New Arrival:</strong> Will be marked as "New" and appear in new arrivals sections</li>
              <li>• <strong>In Stock:</strong> Controls whether customers can purchase this product</li>
            </ul>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-500 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
            >
              <Save className="mr-2 h-4 w-4" />
              <span>Add product</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductForm;
