import React, { useState, useEffect } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../contexts/LanguageContext';
import { T } from './Translation';

interface AttributesEditorProps {
  attributes: Record<string, any>;
  onChange: (attributes: Record<string, any>) => void;
}

const AttributesEditor: React.FC<AttributesEditorProps> = ({ attributes, onChange }) => {
  const { t } = useLanguage();
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string | null>(null);
  const [tempKey, setTempKey] = useState('');
  const [tempValue, setTempValue] = useState('');
  const [attributeOrder, setAttributeOrder] = useState<string[]>([]);

  // Initialize attribute order when attributes change
  useEffect(() => {
    const currentKeys = Object.keys(attributes || {});
    setAttributeOrder(prevOrder => {
      // Keep existing order for keys that still exist, add new keys at the end
      const existingKeys = prevOrder.filter(key => key in (attributes || {}));
      const newKeys = currentKeys.filter(key => !prevOrder.includes(key));
      return [...existingKeys, ...newKeys];
    });
  }, [attributes]);

  const handleAddAttribute = () => {
    if (newKey.trim() && newValue.trim()) {
      onChange({
        ...attributes,
        [newKey.trim()]: newValue.trim()
      });
      setNewKey('');
      setNewValue('');
    }
  };

  const handleRemoveAttribute = (key: string) => {
    const updated = { ...attributes };
    delete updated[key];
    // Remove from order array
    setAttributeOrder(prevOrder => prevOrder.filter(k => k !== key));
    onChange(updated);
  };

  const handleStartEditingKey = (key: string, value: string) => {
    setEditingKey(key);
    setTempKey(key);
    setTempValue(value);
  };

  const handleStartEditingValue = (key: string, value: string) => {
    setEditingValue(key);
    setTempKey(key);
    setTempValue(value);
  };

  const handleFinishEditing = () => {
    if (editingKey && tempKey.trim() && tempValue.trim()) {
      const updated = { ...attributes };
      const newKey = tempKey.trim();
      
      if (editingKey !== newKey) {
        delete updated[editingKey];
        // Update the order array to reflect the key change
        setAttributeOrder(prevOrder => 
          prevOrder.map(key => key === editingKey ? newKey : key)
        );
      }
      updated[newKey] = tempValue.trim();
      onChange(updated);
    }
    setEditingKey(null);
    setEditingValue(null);
    setTempKey('');
    setTempValue('');
  };

  const handleCancelEditing = () => {
    setEditingKey(null);
    setEditingValue(null);
    setTempKey('');
    setTempValue('');
  };

  // Create ordered attribute entries based on attributeOrder
  const orderedAttributeEntries = attributeOrder
    .filter(key => key in (attributes || {}))
    .map(key => [key, attributes[key]] as [string, any]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-700">
          <T tKey="products.attributes.title" />
        </label>
        <span className="text-xs text-gray-500">
          <T tKey="products.attributes.description" />
        </span>
      </div>

      {/* Existing Attributes */}
      {orderedAttributeEntries.length > 0 && (
        <div className="space-y-2">
          {orderedAttributeEntries.map(([key, value], index) => (
            <div key={`attribute-${index}`} className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
              <input
                type="text"
                value={editingKey === key ? tempKey : key}
                onChange={(e) => {
                  if (editingKey === key) {
                    setTempKey(e.target.value);
                  } else {
                    handleStartEditingKey(key, value);
                    setTempKey(e.target.value);
                  }
                }}
                onFocus={() => {
                  if (editingKey !== key) {
                    handleStartEditingKey(key, value);
                  }
                }}
                onBlur={handleFinishEditing}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleFinishEditing();
                  } else if (e.key === 'Escape') {
                    handleCancelEditing();
                  }
                }}
                className="input-field flex-1"
                placeholder={t('products.attributes.keyPlaceholder')}
              />
              <input
                type="text"
                value={editingValue === key ? tempValue : value}
                onChange={(e) => {
                  if (editingValue === key) {
                    setTempValue(e.target.value);
                  } else {
                    handleStartEditingValue(key, value);
                    setTempValue(e.target.value);
                  }
                }}
                onFocus={() => {
                  if (editingValue !== key) {
                    handleStartEditingValue(key, value);
                  }
                }}
                onBlur={handleFinishEditing}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleFinishEditing();
                  } else if (e.key === 'Escape') {
                    handleCancelEditing();
                  }
                }}
                className="input-field flex-1"
                placeholder={t('products.attributes.valuePlaceholder')}
              />
              <button
                type="button"
                onClick={() => handleRemoveAttribute(key)}
                className="text-red-600 hover:text-red-800 p-2"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Attribute */}
      <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
        <input
          type="text"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddAttribute()}
          className="input-field flex-1"
          placeholder={t('products.attributes.keyPlaceholder')}
        />
        <input
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddAttribute()}
          className="input-field flex-1"
          placeholder={t('products.attributes.addValuePlaceholder')}
        />
        <button
          type="button"
          onClick={handleAddAttribute}
          disabled={!newKey.trim() || !newValue.trim()}
          className="btn-primary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>

      {orderedAttributeEntries.length === 0 && (
        <p className="text-sm text-gray-500 italic">
          <T tKey="products.attributes.noAttributes" />
        </p>
      )}
    </div>
  );
};

export default AttributesEditor;
