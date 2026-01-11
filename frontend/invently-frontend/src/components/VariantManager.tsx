import React, { useState } from 'react';
import { PlusIcon, XMarkIcon, PencilIcon } from '@heroicons/react/24/outline';
import { ProductVariant, CreateVariantData } from '../types';
import { productsAPI } from '../utils/api';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import { useLanguage } from '../contexts/LanguageContext';
import { T } from './Translation';
import ConfirmationModal from './ConfirmationModal';
import CustomDropdown from './CustomDropdown';

interface VariantManagerProps {
  productId?: string;
  variants: ProductVariant[];
  onVariantsChange: (variants: ProductVariant[]) => void;
  isCreating?: boolean;
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
  const { t } = useLanguage();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [formData, setFormData] = useState<VariantFormData>({
    sku: '',
    options: [{ key: '', value: '' }],
    price: '',
    stockQuantity: '0',
    isActive: true
  });
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; variant: ProductVariant | null }>({
    isOpen: false,
    variant: null
  });
  const [deleting, setDeleting] = useState(false);

  const resetForm = () => {
    setFormData({
      sku: '',
      options: [{ key: '', value: '' }],
      price: '',
      stockQuantity: '0',
      isActive: true
    });
    setShowAddForm(false);
    setEditingVariantId(null);
  };

  const startEditing = (variant: ProductVariant) => {
    const optionsArray = Object.entries(variant.options).map(([key, value]) => ({
      key,
      value: String(value)
    }));

    setFormData({
      sku: variant.sku || '',
      options: optionsArray.length > 0 ? optionsArray : [{ key: '', value: '' }],
      price: variant.price?.toString() || '',
      stockQuantity: variant.stockQuantity.toString(),
      isActive: variant.isActive
    });
    setEditingVariantId(variant.id);
    setShowAddForm(false);
  };

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
    const validOptions = formData.options.filter(opt => opt.key.trim() && opt.value.trim());
    if (validOptions.length === 0) {
      handleApiError(new Error(t('products.variants.validationError')), t('common.error'));
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

      if (editingVariantId) {
        onVariantsChange(variants.map(v => v.id === editingVariantId ? { ...newVariant, id: editingVariantId } : v));
      } else {
        onVariantsChange([...variants, newVariant]);
      }
      handleSuccess(editingVariantId ? t('products.variants.success.updated') : t('products.variants.success.added'));
      resetForm();
    } else {
      setSaving(true);
      try {
        if (editingVariantId) {
          const updated = await productsAPI.updateVariant(productId, editingVariantId, variantData);
          onVariantsChange(variants.map(v => v.id === editingVariantId ? updated : v));
          handleSuccess(t('products.variants.success.updated'));
        } else {
          const created = await productsAPI.createVariant(productId, variantData);
          onVariantsChange([...variants, created]);
          handleSuccess(t('products.variants.success.created'));
        }
        resetForm();
      } catch (error) {
        handleApiError(error, t('products.variants.errors.saveFailed'));
      } finally {
        setSaving(false);
      }
    }
  };

  const handleDeleteClick = (variant: ProductVariant) => {
    setDeleteModal({ isOpen: true, variant });
  };

  const handleConfirmDelete = async () => {
    const variant = deleteModal.variant;
    if (!variant) return;

    if (isCreating || !productId || variant.id.startsWith('temp-')) {
      onVariantsChange(variants.filter(v => v.id !== variant.id));
      handleSuccess(t('products.variants.success.removed'));
      setDeleteModal({ isOpen: false, variant: null });
    } else {
      setDeleting(true);
      try {
        await productsAPI.deleteVariant(productId, variant.id);
        onVariantsChange(variants.filter(v => v.id !== variant.id));
        handleSuccess(t('products.variants.success.deleted'));
        setDeleteModal({ isOpen: false, variant: null });
      } catch (error) {
        handleApiError(error, t('products.variants.errors.deleteFailed'));
      } finally {
        setDeleting(false);
      }
    }
  };

  const isFormVisible = showAddForm || editingVariantId;

  // Render the form as a card
  const renderVariantForm = (isEditing: boolean) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 shadow-sm">
      {/* Form Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <h4 className="text-base font-semibold text-gray-900">
          <T tKey={isEditing ? 'products.variants.editVariant' : 'products.variants.newVariant'} />
        </h4>
        <button
          type="button"
          onClick={resetForm}
          className="p-1 rounded text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4 sm:space-y-5">
        {/* Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
            <T tKey="products.variants.options" /> *
          </label>
          <div className="space-y-3">
            {formData.options.map((option, index) => (
              <div key={`option-${index}`} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <div className="flex gap-2 sm:gap-3 flex-1">
                  <input
                    type="text"
                    value={option.key}
                    onChange={(e) => handleOptionChange(index, 'key', e.target.value)}
                    placeholder={t('products.variants.optionKeyPlaceholder')}
                    className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                  <input
                    type="text"
                    value={option.value}
                    onChange={(e) => handleOptionChange(index, 'value', e.target.value)}
                    placeholder={t('products.variants.optionValuePlaceholder')}
                    className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                  {formData.options.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleAddOption}
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <PlusIcon className="w-4 h-4" />
            <T tKey="products.variants.addOption" />
          </button>
        </div>

        {/* SKU & Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <T tKey="products.variants.sku" />
            </label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
              placeholder={t('products.variants.skuPlaceholder')}
              className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <T tKey="products.variants.priceOverride" />
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              placeholder={t('products.variants.priceOverridePlaceholder')}
              className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Stock & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <T tKey="products.variants.stockQuantity" /> *
            </label>
            <input
              type="number"
              min="0"
              value={formData.stockQuantity}
              onChange={(e) => setFormData(prev => ({ ...prev, stockQuantity: e.target.value }))}
              className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <T tKey="products.variants.status" />
            </label>
            <CustomDropdown
              value={formData.isActive ? 'active' : 'inactive'}
              onChange={(value) => setFormData(prev => ({ ...prev, isActive: value === 'active' }))}
              options={[
                { value: 'active', label: t('products.variants.active') },
                { value: 'inactive', label: t('products.variants.inactive') }
              ]}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-3">
          <button
            type="button"
            onClick={resetForm}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <T tKey="products.variants.cancel" />
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? t('products.variants.saving') : isEditing ? t('products.variants.update') : t('products.variants.addVariantButton')}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div>
        <h3 className="text-base font-semibold text-gray-900">
          <T tKey="products.variants.title" />
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          <T tKey="products.variants.description" />
        </p>
      </div>

      {/* Variant List */}
      {variants.length > 0 && (
        <div className="space-y-3">
          {variants.map((variant) => (
            <React.Fragment key={variant.id}>
              {editingVariantId !== variant.id && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 group">
                  <div className="flex items-start justify-between gap-4">
                    {/* Variant Info */}
                    <div className="flex-1 min-w-0">
                      {/* Options as text */}
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm text-gray-900">
                          {Object.entries(variant.options).map(([key, value], idx) => (
                            <span key={key}>
                              <span className="font-medium">{key}</span>
                              <span className="text-gray-400 mx-1">-</span>
                              <span>{value}</span>
                              {idx < Object.entries(variant.options).length - 1 && (
                                <span className="text-gray-300 mx-2">|</span>
                              )}
                            </span>
                          ))}
                        </span>
                        {!variant.isActive && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                            <T tKey="products.variants.inactive" />
                          </span>
                        )}
                      </div>
                      {/* Price and Stock info */}
                      <div className="text-sm text-gray-600">
                        <span>
                          <T tKey="products.variants.priceLabel" />: {variant.price ? `$${variant.price.toFixed(2)}` : t('products.variants.basePrice')}
                        </span>
                        <span className="mx-2">•</span>
                        <span>
                          <T tKey="products.variants.stock" />: {variant.stockQuantity}
                        </span>
                        {variant.sku && (
                          <>
                            <span className="mx-2">•</span>
                            <span className="font-mono text-xs">{variant.sku}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEditing(variant)}
                        className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title={t('common.edit')}
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(variant)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title={t('common.delete')}
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Inline Edit Form */}
              {editingVariantId === variant.id && renderVariantForm(true)}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Add New Variant Button */}
      {!isFormVisible && (
        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowAddForm(true);
          }}
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <PlusIcon className="w-4 h-4" />
          <T tKey="products.variants.addVariant" />
        </button>
      )}

      {/* Add New Variant Form */}
      {showAddForm && !editingVariantId && renderVariantForm(false)}

      {/* Empty State */}
      {variants.length === 0 && !showAddForm && (
        <p className="text-xs text-blue-500 italic">
          <T tKey="products.variants.noVariants" />
        </p>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, variant: null })}
        onConfirm={handleConfirmDelete}
        title={t('products.variants.deleteConfirm.title')}
        message={t('products.variants.deleteConfirm.message')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        isLoading={deleting}
        type="danger"
      />
    </div>
  );
};

export default VariantManager;
