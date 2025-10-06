import React, { useState, useEffect } from 'react';
import { PlusIcon, XMarkIcon, PencilIcon, CheckIcon } from '@heroicons/react/24/outline';
import { ProductVariant, CreateVariantData } from '../types';
import { productsAPI } from '../utils/api';
import { handleApiError, handleSuccess } from '../utils/errorHandler';

interface VariantManagerProps {
  productId?: string; // For editing existing product
  variants: ProductVariant[];
  onVariantsChange: (variants: ProductVariant[]) => void;
  isCreating?: boolean; // True when creating new product
}

interface VariantFormData {
  sku: string;
  options: { key: string; value: string }[];
  price: string;
  stockQuantity: string;
  isActive: boolean;
}

const VariantManager: React.FC<VariantManagerProps> = ({
  productId,
  variants,
  onVariantsChange,
  isCreating = false
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [formData, setFormData] = useState<VariantFormData>({
    sku: '',
    options: [{ key: '', value: '' }],
    price: '',
    stockQuantity: '0',
    isActive: true
  });
  const [saving, setSaving] = useState(false);

  // Reset form when closing
  const resetForm = () => {
    setFormData({
      sku: '',
      options: [{ key: '', value: '' }],
      price: '',
      stockQuantity: '0',
      isActive: true
    });
    setShowForm(false);
    setEditingVariant(null);
  };

  // Load variant data when editing
  useEffect(() => {
    if (editingVariant) {
      const optionsArray = Object.entries(editingVariant.options).map(([key, value]) => ({
        key,
        value: String(value)
      }));

      setFormData({
        sku: editingVariant.sku || '',
        options: optionsArray.length > 0 ? optionsArray : [{ key: '', value: '' }],
        price: editingVariant.price?.toString() || '',
        stockQuantity: editingVariant.stockQuantity.toString(),
        isActive: editingVariant.isActive
      });
      setShowForm(true);
    }
  }, [editingVariant]);

  const handleAddOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { key: '', value: '' }]
    }));
  };

  const handleRemoveOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const handleOptionChange = (index: number, field: 'key' | 'value', value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) =>
        i === index ? { ...opt, [field]: value } : opt
      )
    }));
  };

  const handleSubmit = async () => {
    // Validate options
    const validOptions = formData.options.filter(opt => opt.key.trim() && opt.value.trim());
    if (validOptions.length === 0) {
      handleApiError(new Error('At least one option is required'), 'Validation Error');
      return;
    }

    const optionsObject = validOptions.reduce((acc, opt) => {
      acc[opt.key.trim()] = opt.value.trim();
      return acc;
    }, {} as Record<string, string>);

    const variantData: CreateVariantData = {
      sku: formData.sku.trim() || undefined,
      options: optionsObject,
      price: formData.price ? parseFloat(formData.price) : undefined,
      stockQuantity: parseInt(formData.stockQuantity) || 0,
      isActive: formData.isActive
    };

    if (isCreating || !productId) {
      // For new products, just add to local state
      const newVariant: ProductVariant = {
        id: `temp-${Date.now()}`,
        productId: productId || 'temp',
        sku: variantData.sku,
        options: variantData.options,
        price: variantData.price,
        stockQuantity: variantData.stockQuantity || 0,
        isActive: variantData.isActive !== undefined ? variantData.isActive : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingVariant) {
        onVariantsChange(variants.map(v => v.id === editingVariant.id ? { ...newVariant, id: editingVariant.id } : v));
      } else {
        onVariantsChange([...variants, newVariant]);
      }
      handleSuccess(editingVariant ? 'Variant updated' : 'Variant added');
      resetForm();
    } else {
      // For existing products, save to backend
      setSaving(true);
      try {
        if (editingVariant) {
          const updated = await productsAPI.updateVariant(productId, editingVariant.id, variantData);
          onVariantsChange(variants.map(v => v.id === editingVariant.id ? updated : v));
          handleSuccess('Variant updated successfully');
        } else {
          const created = await productsAPI.createVariant(productId, variantData);
          onVariantsChange([...variants, created]);
          handleSuccess('Variant created successfully');
        }
        resetForm();
      } catch (error) {
        handleApiError(error, 'Failed to save variant');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleDelete = async (variant: ProductVariant) => {
    if (!confirm('Are you sure you want to delete this variant?')) return;

    if (isCreating || !productId || variant.id.startsWith('temp-')) {
      // Just remove from local state
      onVariantsChange(variants.filter(v => v.id !== variant.id));
      handleSuccess('Variant removed');
    } else {
      // Delete from backend
      try {
        await productsAPI.deleteVariant(productId, variant.id);
        onVariantsChange(variants.filter(v => v.id !== variant.id));
        handleSuccess('Variant deleted successfully');
      } catch (error) {
        handleApiError(error, 'Failed to delete variant');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-semibold text-gray-700">
            Product Variants
          </label>
          <span className="text-xs text-gray-500">
            Create variants for different sizes, colors, or configurations
          </span>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="btn-primary text-sm px-3 py-2"
          >
            <PlusIcon className="w-4 h-4 mr-1 inline" />
            Add Variant
          </button>
        )}
      </div>

      {/* Variant List */}
      {variants.length > 0 && (
        <div className="space-y-2">
          {variants.map((variant) => (
            <div
              key={variant.id}
              className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {variant.sku && (
                    <span className="text-xs font-mono bg-gray-200 px-2 py-1 rounded">
                      {variant.sku}
                    </span>
                  )}
                  <div className="flex gap-1">
                    {Object.entries(variant.options).map(([key, value]) => (
                      <span
                        key={key}
                        className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                      >
                        {key}: {value}
                      </span>
                    ))}
                  </div>
                  {!variant.isActive && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  Price: ${variant.price?.toFixed(2) || 'Base price'} • Stock: {variant.stockQuantity}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingVariant(variant)}
                  className="text-blue-600 hover:text-blue-800 p-2"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(variant)}
                  className="text-red-600 hover:text-red-800 p-2"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Variant Form */}
      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {editingVariant ? 'Edit Variant' : 'New Variant'}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Options (e.g., size, color) *
            </label>
            {formData.options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={option.key}
                  onChange={(e) => handleOptionChange(index, 'key', e.target.value)}
                  placeholder="Key (e.g., size)"
                  className="input-field flex-1"
                />
                <input
                  type="text"
                  value={option.value}
                  onChange={(e) => handleOptionChange(index, 'value', e.target.value)}
                  placeholder="Value (e.g., Medium)"
                  className="input-field flex-1"
                />
                {formData.options.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className="text-red-600 hover:text-red-800 p-2"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddOption}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Add Option
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU (optional)
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                placeholder="e.g., TSHIRT-RED-M"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price Override (optional)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="Leave empty for base price"
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity *
              </label>
              <input
                type="number"
                min="0"
                value={formData.stockQuantity}
                onChange={(e) => setFormData(prev => ({ ...prev, stockQuantity: e.target.value }))}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="btn-outline text-sm px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="btn-primary text-sm px-4 py-2 disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingVariant ? 'Update' : 'Add Variant'}
            </button>
          </div>
        </div>
      )}

      {variants.length === 0 && !showForm && (
        <p className="text-sm text-gray-500 italic">
          No variants yet. Add variants for different sizes, colors, or configurations.
        </p>
      )}
    </div>
  );
};

export default VariantManager;
