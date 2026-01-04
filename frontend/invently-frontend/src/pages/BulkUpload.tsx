import React, { useState } from 'react';
import {
  ArrowUpTrayIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XMarkIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import { bulkUploadAPI } from '../utils/api';
import toast from 'react-hot-toast';

const BulkUpload: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }
      setSelectedFile(file);
      setUploadResults(null);
      setShowResults(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    try {
      const results = await bulkUploadAPI.uploadCSV(selectedFile);
      setUploadResults(results);
      setShowResults(true);

      const totalSuccess = results.categories.created + 
                          results.categories.updated + 
                          results.products.created + 
                          results.products.updated;
      
      if (results.errors.length === 0) {
        toast.success(`Successfully imported ${totalSuccess} items!`);
      } else {
        toast.success(`Imported ${totalSuccess} items with ${results.errors.length} errors`);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await bulkUploadAPI.downloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'bulk-upload-template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Template downloaded!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download template');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      setSelectedFile(file);
      setUploadResults(null);
      setShowResults(false);
    } else {
      toast.error('Please drop a CSV file');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Upload</h1>
        <p className="text-gray-600">
          Import multiple categories and products at once using a CSV file
        </p>
      </div>

      {/* Instructions Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-blue-900">Quick Start Guide</h2>
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
          >
            {showGuide ? 'Hide' : 'Show'} Detailed Guide
            <QuestionMarkCircleIcon className="w-5 h-5" />
          </button>
        </div>
        <ol className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start">
            <span className="font-semibold mr-2">1.</span>
            <span>Download the CSV template below</span>
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2">2.</span>
            <span>Fill in your categories and products following the format</span>
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2">3.</span>
            <span>For nested categories, use " &gt; " separator (e.g., "Electronics &gt; Phones")</span>
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2">4.</span>
            <span>For product variants (sizes, colors, etc.), use multiple rows with the same product name but different "Variant Options"</span>
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2">5.</span>
            <span>Upload the completed CSV file</span>
          </li>
        </ol>
      </div>

      {/* Comprehensive Guide */}
      {showGuide && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 space-y-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">📚 Complete CSV Format Guide</h3>
            <p className="text-sm text-gray-600 mb-4">
              The CSV file has 10 columns. Here's what each column means and how to use it:
            </p>
          </div>

          {/* Column Descriptions */}
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold text-gray-900 mb-1">1. Category <span className="text-red-500">*</span></h4>
              <p className="text-sm text-gray-600 mb-2">
                The category path. Use " &gt; " to create nested categories (parent &gt; child).
              </p>
              <div className="bg-gray-50 p-3 rounded text-xs font-mono">
                <div className="text-green-600">✓ Electronics</div>
                <div className="text-green-600">✓ Electronics &gt; Phones</div>
                <div className="text-green-600">✓ Fashion &gt; Men &gt; Shirts</div>
              </div>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-semibold text-gray-900 mb-1">2. Product Name</h4>
              <p className="text-sm text-gray-600 mb-2">
                The name of your product. Leave empty for category-only rows. Multiple rows with the same name = product with variants.
              </p>
              <div className="bg-gray-50 p-3 rounded text-xs font-mono">
                <div className="text-green-600">✓ iPhone 14 Pro</div>
                <div className="text-green-600">✓ Classic T-Shirt</div>
                <div className="text-gray-400">Leave empty to create categories without products</div>
              </div>
            </div>

            <div className="border-l-4 border-orange-500 pl-4">
              <h4 className="font-semibold text-gray-900 mb-1">3. Variant Options</h4>
              <p className="text-sm text-gray-600 mb-2">
                Optional. Format: <code className="bg-gray-200 px-1 rounded">key1:value1|key2:value2</code>. Leave empty for simple products or first row of variant products.
              </p>
              <div className="bg-gray-50 p-3 rounded text-xs font-mono space-y-1">
                <div className="text-green-600">✓ size:M|color:Black</div>
                <div className="text-green-600">✓ storage:256GB|color:White</div>
                <div className="text-green-600">✓ material:Leather|size:Large</div>
                <div className="text-gray-400">Leave empty for products without variants</div>
              </div>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-semibold text-gray-900 mb-1">4. Product Description</h4>
              <p className="text-sm text-gray-600 mb-2">
                Detailed description of the product. Only needed on first row of product (not on variant rows).
              </p>
              <div className="bg-gray-50 p-3 rounded text-xs font-mono">
                <div className="text-green-600">✓ Latest iPhone with A16 Bionic chip and Dynamic Island</div>
              </div>
            </div>

            <div className="border-l-4 border-yellow-500 pl-4">
              <h4 className="font-semibold text-gray-900 mb-1">5. Price <span className="text-red-500">*</span></h4>
              <p className="text-sm text-gray-600 mb-2">
                Product price (decimal number). For variants, each can have its own price.
              </p>
              <div className="bg-gray-50 p-3 rounded text-xs font-mono">
                <div className="text-green-600">✓ 999.99</div>
                <div className="text-green-600">✓ 29.99</div>
                <div className="text-red-600">✗ $29.99 (don't include currency symbol)</div>
              </div>
            </div>

            <div className="border-l-4 border-indigo-500 pl-4">
              <h4 className="font-semibold text-gray-900 mb-1">6. Stock <span className="text-red-500">*</span></h4>
              <p className="text-sm text-gray-600 mb-2">
                Available quantity (whole number). For variants, this is the stock for that specific variant.
              </p>
              <div className="bg-gray-50 p-3 rounded text-xs font-mono">
                <div className="text-green-600">✓ 50</div>
                <div className="text-green-600">✓ 0 (out of stock)</div>
                <div className="text-red-600">✗ 10.5 (must be whole number)</div>
              </div>
            </div>

            <div className="border-l-4 border-pink-500 pl-4">
              <h4 className="font-semibold text-gray-900 mb-1">7. SKU</h4>
              <p className="text-sm text-gray-600 mb-2">
                Stock Keeping Unit (unique identifier). Auto-generated if left empty.
              </p>
              <div className="bg-gray-50 p-3 rounded text-xs font-mono">
                <div className="text-green-600">✓ IPHONE14PRO-256-BLK</div>
                <div className="text-green-600">✓ TSHIRT-M-WHT</div>
                <div className="text-gray-400">Leave empty to auto-generate</div>
              </div>
            </div>

            <div className="border-l-4 border-teal-500 pl-4">
              <h4 className="font-semibold text-gray-900 mb-1">8. Status</h4>
              <p className="text-sm text-gray-600 mb-2">
                Product status: ACTIVE or DRAFT. Defaults to ACTIVE if empty.
              </p>
              <div className="bg-gray-50 p-3 rounded text-xs font-mono">
                <div className="text-green-600">✓ ACTIVE</div>
                <div className="text-green-600">✓ DRAFT</div>
              </div>
            </div>

            <div className="border-l-4 border-cyan-500 pl-4">
              <h4 className="font-semibold text-gray-900 mb-1">9. Image URLs</h4>
              <p className="text-sm text-gray-600 mb-2">
                Product images. Multiple URLs separated by | (pipe). Only needed on first product row.
              </p>
              <div className="bg-gray-50 p-3 rounded text-xs font-mono">
                <div className="text-green-600">✓ https://example.com/image1.jpg</div>
                <div className="text-green-600">✓ https://example.com/img1.jpg|https://example.com/img2.jpg</div>
              </div>
            </div>

            <div className="border-l-4 border-red-500 pl-4">
              <h4 className="font-semibold text-gray-900 mb-1">10. Attributes</h4>
              <p className="text-sm text-gray-600 mb-2">
                Additional product info. Format: <code className="bg-gray-200 px-1 rounded">key1:value1|key2:value2</code>
              </p>
              <div className="bg-gray-50 p-3 rounded text-xs font-mono">
                <div className="text-green-600">✓ brand:Apple|warranty:1 year</div>
                <div className="text-green-600">✓ material:Cotton|fit:Regular|care:Machine wash</div>
              </div>
            </div>
          </div>

          {/* Complete Examples */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📝 Complete Examples</h3>
            
            {/* Example 1: Category Only */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-2">Example 1: Creating Categories Only</h4>
              <p className="text-sm text-gray-600 mb-2">To create category structure without products, leave product columns empty:</p>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs font-mono">
                <div className="text-green-400">Electronics,,,,,,,,,</div>
                <div className="text-green-400">Electronics &gt; Phones,,,,,,,,,</div>
                <div className="text-green-400">Electronics &gt; Laptops,,,,,,,,,</div>
                <div className="text-gray-400 mt-2">// Creates: Electronics (parent) with 2 subcategories (Phones, Laptops)</div>
              </div>
            </div>

            {/* Example 2: Simple Product */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-2">Example 2: Simple Product (No Variants)</h4>
              <p className="text-sm text-gray-600 mb-2">Product without size/color variations:</p>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs font-mono">
                <div className="text-blue-400">Category,Product Name,Variant Options,Description,Price,Stock,SKU,Status,Images,Attributes</div>
                <div className="text-green-400">Electronics &gt; Laptops,MacBook Pro 16,,Powerful laptop with M2 Pro chip,2499.99,30,MBP16,ACTIVE,https://example.com/mbp.jpg,brand:Apple|ram:16GB</div>
                <div className="text-gray-400 mt-2">// Creates: 1 product with no variants</div>
              </div>
            </div>

            {/* Example 3: Product with Variants */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-2">Example 3: Product with Variants (T-Shirt with Sizes & Colors)</h4>
              <p className="text-sm text-gray-600 mb-2">First row = base product info, following rows = variants:</p>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs font-mono">
                <div className="text-blue-400">Category,Product Name,Variant Options,Description,Price,Stock,SKU,Status,Images,Attributes</div>
                <div className="text-yellow-400">Fashion &gt; Men &gt; Shirts,Classic T-Shirt,,100% organic cotton tee,29.99,0,TSHIRT-BASE,ACTIVE,https://example.com/tshirt.jpg,material:Cotton|fit:Regular</div>
                <div className="text-green-400">Fashion &gt; Men &gt; Shirts,Classic T-Shirt,size:S|color:White,,29.99,50,TSHIRT-S-WHT,ACTIVE,,</div>
                <div className="text-green-400">Fashion &gt; Men &gt; Shirts,Classic T-Shirt,size:M|color:White,,29.99,100,TSHIRT-M-WHT,ACTIVE,,</div>
                <div className="text-green-400">Fashion &gt; Men &gt; Shirts,Classic T-Shirt,size:L|color:White,,29.99,75,TSHIRT-L-WHT,ACTIVE,,</div>
                <div className="text-green-400">Fashion &gt; Men &gt; Shirts,Classic T-Shirt,size:M|color:Black,,32.99,80,TSHIRT-M-BLK,ACTIVE,,</div>
                <div className="text-gray-400 mt-2">// Creates: 1 product "Classic T-Shirt" with 4 variants</div>
                <div className="text-gray-400">// Note: Yellow row has base info + image, green rows define variants</div>
                <div className="text-gray-400">// Black M has different price (32.99) than White variants (29.99)</div>
              </div>
            </div>

            {/* Example 4: Phone with Storage Options */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-2">Example 4: Phone with Storage & Color Variants</h4>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs font-mono">
                <div className="text-blue-400">Category,Product Name,Variant Options,Description,Price,Stock,SKU,Status,Images,Attributes</div>
                <div className="text-yellow-400">Electronics &gt; Phones,iPhone 14 Pro,,Latest iPhone with A16 chip,999.99,0,IPHONE14PRO,ACTIVE,https://example.com/iphone.jpg,brand:Apple|warranty:1 year</div>
                <div className="text-green-400">Electronics &gt; Phones,iPhone 14 Pro,storage:128GB|color:Black,,999.99,30,IP14-128-BLK,ACTIVE,,</div>
                <div className="text-green-400">Electronics &gt; Phones,iPhone 14 Pro,storage:256GB|color:Black,,1099.99,25,IP14-256-BLK,ACTIVE,,</div>
                <div className="text-green-400">Electronics &gt; Phones,iPhone 14 Pro,storage:512GB|color:Black,,1299.99,20,IP14-512-BLK,ACTIVE,,</div>
                <div className="text-green-400">Electronics &gt; Phones,iPhone 14 Pro,storage:128GB|color:White,,999.99,30,IP14-128-WHT,ACTIVE,,</div>
                <div className="text-green-400">Electronics &gt; Phones,iPhone 14 Pro,storage:256GB|color:White,,1099.99,25,IP14-256-WHT,ACTIVE,,</div>
                <div className="text-gray-400 mt-2">// Creates: 1 product with 5 variants (different storage sizes and colors)</div>
                <div className="text-gray-400">// Each storage upgrade increases price by $100</div>
              </div>
            </div>
          </div>

          {/* Common Mistakes */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">⚠️ Common Mistakes to Avoid</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-red-500 font-bold">✗</span>
                <div>
                  <p className="font-semibold text-gray-800">Wrong separator for categories</p>
                  <p className="text-gray-600">Use " &gt; " not "/" or "&gt;" or "-"</p>
                  <div className="bg-red-50 p-2 rounded mt-1 font-mono text-xs">
                    <span className="text-red-600">✗ Electronics/Phones</span> or <span className="text-red-600">✗ Electronics&gt;Phones</span>
                    <br />
                    <span className="text-green-600">✓ Electronics &gt; Phones</span> (space before and after &gt;)
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-red-500 font-bold">✗</span>
                <div>
                  <p className="font-semibold text-gray-800">Including currency symbols in price</p>
                  <div className="bg-red-50 p-2 rounded mt-1 font-mono text-xs">
                    <span className="text-red-600">✗ $29.99</span> or <span className="text-red-600">✗ 29.99$</span>
                    <br />
                    <span className="text-green-600">✓ 29.99</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-red-500 font-bold">✗</span>
                <div>
                  <p className="font-semibold text-gray-800">Forgetting variant options format</p>
                  <div className="bg-red-50 p-2 rounded mt-1 font-mono text-xs">
                    <span className="text-red-600">✗ size=M, color=Black</span> or <span className="text-red-600">✗ M|Black</span>
                    <br />
                    <span className="text-green-600">✓ size:M|color:Black</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-red-500 font-bold">✗</span>
                <div>
                  <p className="font-semibold text-gray-800">Adding extra rows or notes after data</p>
                  <p className="text-gray-600">CSV should only contain header + data rows. No blank lines, no notes at the end.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">💡 Pro Tips</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <p><strong>Start small:</strong> Test with 2-3 products first, then upload your full catalog</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <p><strong>Use Excel/Google Sheets:</strong> Easier to edit, then export as CSV</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <p><strong>Keep a backup:</strong> Save your CSV file before uploading</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <p><strong>Re-upload to update:</strong> If a product with the same name exists, it will be updated instead of creating a duplicate</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <p><strong>Stock = 0 on base product:</strong> When using variants, set stock to 0 on the first row (base product), only variants need real stock numbers</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Download */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">CSV Template</h3>
            <p className="text-sm text-gray-600">
              Download the template to see the required format and examples
            </p>
          </div>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            Download Template
          </button>
        </div>
      </div>

      {/* Upload Area */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload CSV File</h3>
        
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer"
        >
          <ArrowUpTrayIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          
          {selectedFile ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircleIcon className="w-6 h-6" />
                <span className="font-semibold">{selectedFile.name}</span>
              </div>
              <p className="text-sm text-gray-500">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Remove file
              </button>
            </div>
          ) : (
            <>
              <p className="text-lg font-semibold text-gray-700 mb-2">
                Drag and drop your CSV file here
              </p>
              <p className="text-sm text-gray-500 mb-4">or</p>
              <label className="inline-block">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <span className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors cursor-pointer inline-block">
                  Browse Files
                </span>
              </label>
            </>
          )}
        </div>

        {selectedFile && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className={`flex items-center gap-2 px-8 py-3 font-semibold rounded-xl transition-all shadow-sm hover:shadow-md ${
                uploading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800'
              }`}
            >
              {uploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowUpTrayIcon className="w-5 h-5" />
                  Upload & Import
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {showResults && uploadResults && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Import Results</h3>
            <button
              onClick={() => setShowResults(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-green-600 text-sm font-semibold mb-1">Categories Created</div>
              <div className="text-3xl font-bold text-green-900">{uploadResults.categories.created}</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-blue-600 text-sm font-semibold mb-1">Categories Updated</div>
              <div className="text-3xl font-bold text-blue-900">{uploadResults.categories.updated}</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-green-600 text-sm font-semibold mb-1">Products Created</div>
              <div className="text-3xl font-bold text-green-900">{uploadResults.products.created}</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-blue-600 text-sm font-semibold mb-1">Products Updated</div>
              <div className="text-3xl font-bold text-blue-900">{uploadResults.products.updated}</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-green-600 text-sm font-semibold mb-1">Variants Created</div>
              <div className="text-3xl font-bold text-green-900">{uploadResults.variants?.created || 0}</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-blue-600 text-sm font-semibold mb-1">Variants Updated</div>
              <div className="text-3xl font-bold text-blue-900">{uploadResults.variants?.updated || 0}</div>
            </div>
          </div>

          {/* Errors */}
          {uploadResults.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-900 font-semibold mb-3">
                <ExclamationCircleIcon className="w-5 h-5" />
                Errors ({uploadResults.errors.length})
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {uploadResults.errors.map((error: any, index: number) => (
                  <div key={index} className="text-sm text-red-800 bg-white rounded p-2">
                    <span className="font-semibold">
                      {error.category || error.product}:
                    </span>{' '}
                    {error.error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BulkUpload;

