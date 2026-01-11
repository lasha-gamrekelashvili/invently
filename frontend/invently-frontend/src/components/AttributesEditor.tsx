import React, { useState, useEffect } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../contexts/LanguageContext';
import { T } from './Translation';

interface AttributesEditorProps {
  attributes: Record<string, any>;
  onChange: (attributes: Record<string, any>) => void;
}

interface AttributeRow {
  id: string;
  key: string;
  value: string;
}

const AttributesEditor: React.FC<AttributesEditorProps> = ({ attributes, onChange }) => {
  const { t } = useLanguage();
  const [rows, setRows] = useState<AttributeRow[]>([]);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  // Sync rows with external attributes
  useEffect(() => {
    const entries = Object.entries(attributes || {});
    const newRows = entries.map(([key, value], index) => ({
      id: `attr-${index}-${key}`,
      key,
      value: String(value)
    }));
    setRows(newRows);
  }, [attributes]);

  // Update parent when rows change
  const updateAttributes = (updatedRows: AttributeRow[]) => {
    const newAttributes: Record<string, any> = {};
    updatedRows.forEach(row => {
      if (row.key.trim()) {
        newAttributes[row.key.trim()] = row.value.trim();
      }
    });
    onChange(newAttributes);
  };

  const handleRowKeyChange = (id: string, newKeyValue: string) => {
    const updatedRows = rows.map(row =>
      row.id === id ? { ...row, key: newKeyValue } : row
    );
    setRows(updatedRows);
  };

  const handleRowValueChange = (id: string, newValueValue: string) => {
    const updatedRows = rows.map(row =>
      row.id === id ? { ...row, value: newValueValue } : row
    );
    setRows(updatedRows);
  };

  const handleRowBlur = () => {
    // Update parent on blur to save changes
    updateAttributes(rows);
  };

  const handleRemoveRow = (id: string) => {
    const updatedRows = rows.filter(row => row.id !== id);
    setRows(updatedRows);
    updateAttributes(updatedRows);
  };

  const handleAddAttribute = () => {
    if (newKey.trim() && newValue.trim()) {
      const newRow: AttributeRow = {
        id: `attr-${Date.now()}`,
        key: newKey.trim(),
        value: newValue.trim()
      };
      const updatedRows = [...rows, newRow];
      setRows(updatedRows);
      updateAttributes(updatedRows);
      setNewKey('');
      setNewValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddAttribute();
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div>
        <h3 className="text-base font-semibold text-gray-900">
          <T tKey="products.attributes.title" />
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          <T tKey="products.attributes.description" />
        </p>
      </div>

      {/* Existing Attributes - Always as Input Fields */}
      {rows.length > 0 && (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="flex gap-3 items-center">
              {/* Key Input */}
              <div className="flex-1">
                <input
                  type="text"
                  value={row.key}
                  onChange={(e) => handleRowKeyChange(row.id, e.target.value)}
                  onBlur={handleRowBlur}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder={t('products.attributes.keyPlaceholder')}
                />
              </div>
              {/* Value Input */}
              <div className="flex-1">
                <input
                  type="text"
                  value={row.value}
                  onChange={(e) => handleRowValueChange(row.id, e.target.value)}
                  onBlur={handleRowBlur}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder={t('products.attributes.addValuePlaceholder')}
                />
              </div>
              {/* Delete Button */}
              <button
                type="button"
                onClick={() => handleRemoveRow(row.id)}
                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Attribute Row */}
      <div className="flex gap-3 items-center">
        <div className="flex-1">
          <input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder={t('products.attributes.keyPlaceholder')}
          />
        </div>
        <div className="flex-1">
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder={t('products.attributes.addValuePlaceholder')}
          />
        </div>
        <button
          type="button"
          onClick={handleAddAttribute}
          disabled={!newKey.trim() || !newValue.trim()}
          className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Empty State */}
      {rows.length === 0 && !newKey && !newValue && (
        <p className="text-xs text-blue-500 italic">
          <T tKey="products.attributes.noAttributes" />
        </p>
      )}
    </div>
  );
};

export default AttributesEditor;
