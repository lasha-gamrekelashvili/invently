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
import { useLanguage } from '../contexts/LanguageContext';
import { T } from '../components/Translation';

const BulkUpload: React.FC = () => {
  const { t } = useLanguage();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast.error(t('bulkUpload.errors.selectCsv'));
        return;
      }
      setSelectedFile(file);
      setUploadResults(null);
      setShowResults(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error(t('bulkUpload.errors.selectFirst'));
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
        toast.success(t('bulkUpload.success.imported', { count: totalSuccess }));
      } else {
        toast.success(t('bulkUpload.success.importedWithErrors', { count: totalSuccess, errors: results.errors.length }));
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || t('bulkUpload.errors.uploadFailed'));
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
      toast.success(t('bulkUpload.success.templateDownloaded'));
    } catch (error) {
      console.error('Download error:', error);
      toast.error(t('bulkUpload.errors.downloadFailed'));
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
      toast.error(t('bulkUpload.errors.dropCsv'));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="max-w-5xl mx-auto py-4 sm:py-6 px-3 sm:px-4">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          <T tKey="bulkUpload.title" />
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          <T tKey="bulkUpload.subtitle" />
        </p>
      </div>

      {/* Instructions Card */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <h2 className="text-base sm:text-lg font-light text-neutral-900 tracking-tight">
            <T tKey="bulkUpload.quickStart.title" />
          </h2>
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="text-neutral-900 hover:text-neutral-700 text-sm font-medium flex items-center gap-1 self-start sm:self-auto"
          >
            {showGuide ? t('bulkUpload.quickStart.hideGuide') : t('bulkUpload.quickStart.showGuide')}
            <QuestionMarkCircleIcon className="w-5 h-5" />
          </button>
        </div>
        <ol className="space-y-2 text-xs sm:text-sm text-neutral-700">
          <li className="flex items-start">
            <span className="font-semibold mr-2">1.</span>
            <span><T tKey="bulkUpload.quickStart.step1" /></span>
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2">2.</span>
            <span><T tKey="bulkUpload.quickStart.step2" /></span>
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2">3.</span>
            <span><T tKey="bulkUpload.quickStart.step3" /></span>
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2">4.</span>
            <span className="break-words"><T tKey="bulkUpload.quickStart.step4" /></span>
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2">5.</span>
            <span><T tKey="bulkUpload.quickStart.step5" /></span>
          </li>
        </ol>
      </div>

      {/* Comprehensive Guide */}
      {showGuide && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 mb-6 space-y-6">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">📚 <T tKey="bulkUpload.guide.title" /></h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-4">
              <T tKey="bulkUpload.guide.columnsIntro" />
            </p>
          </div>

          {/* Column Descriptions */}
          <div className="space-y-4">
            <div className="border-l-4 border-neutral-900 pl-3 sm:pl-4">
              <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">1. <T tKey="bulkUpload.guide.category.title" /> <span className="text-red-500">*</span></h4>
              <p className="text-xs sm:text-sm text-gray-600 mb-2">
                <T tKey="bulkUpload.guide.category.description" />
              </p>
              <div className="bg-gray-50 p-2 sm:p-3 rounded text-xs font-mono overflow-x-auto">
                <div className="text-green-600 whitespace-nowrap">✓ Electronics</div>
                <div className="text-green-600 whitespace-nowrap">✓ Electronics &gt; Phones</div>
                <div className="text-green-600 whitespace-nowrap">✓ Fashion &gt; Men &gt; Shirts</div>
              </div>
            </div>

            <div className="border-l-4 border-purple-500 pl-3 sm:pl-4">
              <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">2. <T tKey="bulkUpload.guide.productName.title" /></h4>
              <p className="text-xs sm:text-sm text-gray-600 mb-2">
                <T tKey="bulkUpload.guide.productName.description" />
              </p>
              <div className="bg-gray-50 p-2 sm:p-3 rounded text-xs font-mono overflow-x-auto">
                <div className="text-green-600">✓ iPhone 14 Pro</div>
                <div className="text-green-600">✓ Classic T-Shirt</div>
                <div className="text-gray-400"><T tKey="bulkUpload.guide.productName.hint" /></div>
              </div>
            </div>

            <div className="border-l-4 border-orange-500 pl-3 sm:pl-4">
              <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">3. <T tKey="bulkUpload.guide.variantOptions.title" /></h4>
              <p className="text-xs sm:text-sm text-gray-600 mb-2">
                <T tKey="bulkUpload.guide.variantOptions.description" />
              </p>
              <div className="bg-gray-50 p-2 sm:p-3 rounded text-xs font-mono space-y-1 overflow-x-auto">
                <div className="text-green-600 whitespace-nowrap">✓ size:M|color:Black</div>
                <div className="text-green-600 whitespace-nowrap">✓ storage:256GB|color:White</div>
                <div className="text-green-600 whitespace-nowrap">✓ material:Leather|size:Large</div>
                <div className="text-gray-400"><T tKey="bulkUpload.guide.variantOptions.hint" /></div>
              </div>
            </div>

            <div className="border-l-4 border-green-500 pl-3 sm:pl-4">
              <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">4. <T tKey="bulkUpload.guide.productDescription.title" /></h4>
              <p className="text-xs sm:text-sm text-gray-600 mb-2">
                <T tKey="bulkUpload.guide.productDescription.description" />
              </p>
              <div className="bg-gray-50 p-2 sm:p-3 rounded text-xs font-mono overflow-x-auto">
                <div className="text-green-600">✓ Latest iPhone with A16 Bionic chip and Dynamic Island</div>
              </div>
            </div>

            <div className="border-l-4 border-yellow-500 pl-3 sm:pl-4">
              <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">5. <T tKey="bulkUpload.guide.price.title" /> <span className="text-red-500">*</span></h4>
              <p className="text-xs sm:text-sm text-gray-600 mb-2">
                <T tKey="bulkUpload.guide.price.description" />
              </p>
              <div className="bg-gray-50 p-2 sm:p-3 rounded text-xs font-mono overflow-x-auto">
                <div className="text-green-600">✓ 999.99</div>
                <div className="text-green-600">✓ 29.99</div>
                <div className="text-red-600">✗ <T tKey="bulkUpload.guide.price.badExample" /></div>
              </div>
            </div>

            <div className="border-l-4 border-indigo-500 pl-3 sm:pl-4">
              <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">6. <T tKey="bulkUpload.guide.stock.title" /> <span className="text-red-500">*</span></h4>
              <p className="text-xs sm:text-sm text-gray-600 mb-2">
                <T tKey="bulkUpload.guide.stock.description" />
              </p>
              <div className="bg-gray-50 p-2 sm:p-3 rounded text-xs font-mono overflow-x-auto">
                <div className="text-green-600">✓ 50</div>
                <div className="text-green-600">✓ <T tKey="bulkUpload.guide.stock.example2" /></div>
                <div className="text-red-600">✗ <T tKey="bulkUpload.guide.stock.badExample" /></div>
              </div>
            </div>

            <div className="border-l-4 border-pink-500 pl-3 sm:pl-4">
              <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">7. <T tKey="bulkUpload.guide.sku.title" /></h4>
              <p className="text-xs sm:text-sm text-gray-600 mb-2">
                <T tKey="bulkUpload.guide.sku.description" />
              </p>
              <div className="bg-gray-50 p-2 sm:p-3 rounded text-xs font-mono overflow-x-auto">
                <div className="text-green-600 whitespace-nowrap">✓ IPHONE14PRO-256-BLK</div>
                <div className="text-green-600 whitespace-nowrap">✓ TSHIRT-M-WHT</div>
                <div className="text-gray-400"><T tKey="bulkUpload.guide.sku.hint" /></div>
              </div>
            </div>

            <div className="border-l-4 border-teal-500 pl-3 sm:pl-4">
              <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">8. <T tKey="bulkUpload.guide.status.title" /></h4>
              <p className="text-xs sm:text-sm text-gray-600 mb-2">
                <T tKey="bulkUpload.guide.status.description" />
              </p>
              <div className="bg-gray-50 p-2 sm:p-3 rounded text-xs font-mono">
                <div className="text-green-600">✓ ACTIVE</div>
                <div className="text-green-600">✓ DRAFT</div>
              </div>
            </div>

            <div className="border-l-4 border-cyan-500 pl-3 sm:pl-4">
              <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">9. <T tKey="bulkUpload.guide.imageUrls.title" /></h4>
              <p className="text-xs sm:text-sm text-gray-600 mb-2">
                <T tKey="bulkUpload.guide.imageUrls.description" />
              </p>
              <div className="bg-gray-50 p-2 sm:p-3 rounded text-xs font-mono overflow-x-auto">
                <div className="text-green-600 whitespace-nowrap break-all">✓ https://example.com/image1.jpg</div>
                <div className="text-green-600 whitespace-nowrap break-all">✓ https://example.com/img1.jpg|https://example.com/img2.jpg</div>
              </div>
            </div>

            <div className="border-l-4 border-red-500 pl-3 sm:pl-4">
              <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">10. <T tKey="bulkUpload.guide.attributes.title" /></h4>
              <p className="text-xs sm:text-sm text-gray-600 mb-2">
                <T tKey="bulkUpload.guide.attributes.description" />
              </p>
              <div className="bg-gray-50 p-2 sm:p-3 rounded text-xs font-mono overflow-x-auto">
                <div className="text-green-600 whitespace-nowrap">✓ brand:Apple|warranty:1 year</div>
                <div className="text-green-600 whitespace-nowrap">✓ material:Cotton|fit:Regular|care:Machine wash</div>
              </div>
            </div>
          </div>

          {/* Complete Examples */}
          <div className="border-t pt-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">📝 <T tKey="bulkUpload.examples.title" /></h3>
            
            {/* Example 1: Category Only */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base"><T tKey="bulkUpload.examples.categoriesOnly.title" /></h4>
              <p className="text-xs sm:text-sm text-gray-600 mb-2"><T tKey="bulkUpload.examples.categoriesOnly.description" /></p>
              <div className="bg-gray-900 text-gray-100 p-3 sm:p-4 rounded-lg overflow-x-auto text-xs font-mono">
                <div className="text-green-400 whitespace-nowrap">Electronics,,,,,,,,,</div>
                <div className="text-green-400 whitespace-nowrap">Electronics &gt; Phones,,,,,,,,,</div>
                <div className="text-green-400 whitespace-nowrap">Electronics &gt; Laptops,,,,,,,,,</div>
                <div className="text-gray-400 mt-2">// <T tKey="bulkUpload.examples.categoriesOnly.comment" /></div>
              </div>
            </div>

            {/* Example 2: Simple Product */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base"><T tKey="bulkUpload.examples.simpleProduct.title" /></h4>
              <p className="text-xs sm:text-sm text-gray-600 mb-2"><T tKey="bulkUpload.examples.simpleProduct.description" /></p>
              <div className="bg-gray-900 text-gray-100 p-3 sm:p-4 rounded-lg overflow-x-auto text-xs font-mono">
                <div className="text-neutral-400 whitespace-nowrap">Category,Product Name,Variant Options,Description,Price,Stock,SKU,Status,Images,Attributes</div>
                <div className="text-green-400 whitespace-nowrap">Electronics &gt; Laptops,MacBook Pro 16,,Powerful laptop with M2 Pro chip,2499.99,30,MBP16,ACTIVE,https://example.com/mbp.jpg,brand:Apple|ram:16GB</div>
                <div className="text-gray-400 mt-2">// <T tKey="bulkUpload.examples.simpleProduct.comment" /></div>
              </div>
            </div>

            {/* Example 3: Product with Variants */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base"><T tKey="bulkUpload.examples.productWithVariants.title" /></h4>
              <p className="text-xs sm:text-sm text-gray-600 mb-2"><T tKey="bulkUpload.examples.productWithVariants.description" /></p>
              <div className="bg-gray-900 text-gray-100 p-3 sm:p-4 rounded-lg overflow-x-auto text-xs font-mono">
                <div className="text-neutral-400 whitespace-nowrap">Category,Product Name,Variant Options,Description,Price,Stock,SKU,Status,Images,Attributes</div>
                <div className="text-yellow-400 whitespace-nowrap">Fashion &gt; Men &gt; Shirts,Classic T-Shirt,,100% organic cotton tee,29.99,0,TSHIRT-BASE,ACTIVE,https://example.com/tshirt.jpg,material:Cotton|fit:Regular</div>
                <div className="text-green-400 whitespace-nowrap">Fashion &gt; Men &gt; Shirts,Classic T-Shirt,size:S|color:White,,29.99,50,TSHIRT-S-WHT,ACTIVE,,</div>
                <div className="text-green-400 whitespace-nowrap">Fashion &gt; Men &gt; Shirts,Classic T-Shirt,size:M|color:White,,29.99,100,TSHIRT-M-WHT,ACTIVE,,</div>
                <div className="text-green-400 whitespace-nowrap">Fashion &gt; Men &gt; Shirts,Classic T-Shirt,size:L|color:White,,29.99,75,TSHIRT-L-WHT,ACTIVE,,</div>
                <div className="text-green-400 whitespace-nowrap">Fashion &gt; Men &gt; Shirts,Classic T-Shirt,size:M|color:Black,,32.99,80,TSHIRT-M-BLK,ACTIVE,,</div>
                <div className="text-gray-400 mt-2">// <T tKey="bulkUpload.examples.productWithVariants.comment1" /></div>
                <div className="text-gray-400">// <T tKey="bulkUpload.examples.productWithVariants.comment2" /></div>
                <div className="text-gray-400">// <T tKey="bulkUpload.examples.productWithVariants.comment3" /></div>
              </div>
            </div>

            {/* Example 4: Phone with Storage Options */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base"><T tKey="bulkUpload.examples.phoneVariants.title" /></h4>
              <div className="bg-gray-900 text-gray-100 p-3 sm:p-4 rounded-lg overflow-x-auto text-xs font-mono">
                <div className="text-neutral-400 whitespace-nowrap">Category,Product Name,Variant Options,Description,Price,Stock,SKU,Status,Images,Attributes</div>
                <div className="text-yellow-400 whitespace-nowrap">Electronics &gt; Phones,iPhone 14 Pro,,Latest iPhone with A16 chip,999.99,0,IPHONE14PRO,ACTIVE,https://example.com/iphone.jpg,brand:Apple|warranty:1 year</div>
                <div className="text-green-400 whitespace-nowrap">Electronics &gt; Phones,iPhone 14 Pro,storage:128GB|color:Black,,999.99,30,IP14-128-BLK,ACTIVE,,</div>
                <div className="text-green-400 whitespace-nowrap">Electronics &gt; Phones,iPhone 14 Pro,storage:256GB|color:Black,,1099.99,25,IP14-256-BLK,ACTIVE,,</div>
                <div className="text-green-400 whitespace-nowrap">Electronics &gt; Phones,iPhone 14 Pro,storage:512GB|color:Black,,1299.99,20,IP14-512-BLK,ACTIVE,,</div>
                <div className="text-green-400 whitespace-nowrap">Electronics &gt; Phones,iPhone 14 Pro,storage:128GB|color:White,,999.99,30,IP14-128-WHT,ACTIVE,,</div>
                <div className="text-green-400 whitespace-nowrap">Electronics &gt; Phones,iPhone 14 Pro,storage:256GB|color:White,,1099.99,25,IP14-256-WHT,ACTIVE,,</div>
                <div className="text-gray-400 mt-2">// <T tKey="bulkUpload.examples.phoneVariants.comment1" /></div>
                <div className="text-gray-400">// <T tKey="bulkUpload.examples.phoneVariants.comment2" /></div>
              </div>
            </div>
          </div>

          {/* Common Mistakes */}
          <div className="border-t pt-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">⚠️ <T tKey="bulkUpload.mistakes.title" /></h3>
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex items-start gap-2">
                <span className="text-red-500 font-bold flex-shrink-0">✗</span>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800"><T tKey="bulkUpload.mistakes.separator.title" /></p>
                  <p className="text-gray-600"><T tKey="bulkUpload.mistakes.separator.description" /></p>
                  <div className="bg-red-50 p-2 rounded mt-1 font-mono text-xs overflow-x-auto">
                    <span className="text-red-600 whitespace-nowrap">✗ Electronics/Phones</span> or <span className="text-red-600 whitespace-nowrap">✗ Electronics&gt;Phones</span>
                    <br />
                    <span className="text-green-600 whitespace-nowrap">✓ <T tKey="bulkUpload.mistakes.separator.good" /></span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-red-500 font-bold flex-shrink-0">✗</span>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800"><T tKey="bulkUpload.mistakes.currency.title" /></p>
                  <div className="bg-red-50 p-2 rounded mt-1 font-mono text-xs overflow-x-auto">
                    <span className="text-red-600">✗ $29.99</span> or <span className="text-red-600">✗ 29.99$</span>
                    <br />
                    <span className="text-green-600">✓ 29.99</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-red-500 font-bold flex-shrink-0">✗</span>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800"><T tKey="bulkUpload.mistakes.variantFormat.title" /></p>
                  <div className="bg-red-50 p-2 rounded mt-1 font-mono text-xs overflow-x-auto">
                    <span className="text-red-600 whitespace-nowrap">✗ size=M, color=Black</span> or <span className="text-red-600 whitespace-nowrap">✗ M|Black</span>
                    <br />
                    <span className="text-green-600 whitespace-nowrap">✓ size:M|color:Black</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-red-500 font-bold flex-shrink-0">✗</span>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800"><T tKey="bulkUpload.mistakes.extraRows.title" /></p>
                  <p className="text-gray-600"><T tKey="bulkUpload.mistakes.extraRows.description" /></p>
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="border-t pt-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">💡 <T tKey="bulkUpload.tips.title" /></h3>
            <div className="space-y-2 text-xs sm:text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <span className="text-green-500 font-bold flex-shrink-0">✓</span>
                <p><T tKey="bulkUpload.tips.startSmall" /></p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500 font-bold flex-shrink-0">✓</span>
                <p><T tKey="bulkUpload.tips.useExcel" /></p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500 font-bold flex-shrink-0">✓</span>
                <p><T tKey="bulkUpload.tips.keepBackup" /></p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500 font-bold flex-shrink-0">✓</span>
                <p><T tKey="bulkUpload.tips.reupload" /></p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500 font-bold flex-shrink-0">✓</span>
                <p><T tKey="bulkUpload.tips.baseStock" /></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Download */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
              <T tKey="bulkUpload.template.title" />
            </h3>
            <p className="text-xs sm:text-sm text-gray-600">
              <T tKey="bulkUpload.template.description" />
            </p>
          </div>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-neutral-800 text-white font-medium rounded-full hover:bg-neutral-700 transition-colors text-sm sm:text-base whitespace-nowrap"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            <T tKey="bulkUpload.template.download" />
          </button>
        </div>
      </div>

      {/* Upload Area */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
          <T tKey="bulkUpload.upload.title" />
        </h3>
        
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-neutral-300 rounded-xl p-8 sm:p-12 text-center hover:border-neutral-400 hover:bg-neutral-50/50 transition-all cursor-pointer"
        >
          <ArrowUpTrayIcon className="w-12 sm:w-16 h-12 sm:h-16 text-gray-400 mx-auto mb-4" />
          
          {selectedFile ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircleIcon className="w-5 sm:w-6 h-5 sm:h-6" />
                <span className="font-semibold text-sm sm:text-base break-all">{selectedFile.name}</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-xs sm:text-sm text-red-600 hover:text-red-700 font-medium"
              >
                <T tKey="bulkUpload.upload.removeFile" />
              </button>
            </div>
          ) : (
            <>
              <p className="text-base sm:text-lg font-semibold text-gray-700 mb-2">
                <T tKey="bulkUpload.upload.dragDrop" />
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mb-4"><T tKey="bulkUpload.upload.or" /></p>
              <label className="inline-block">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <span className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors cursor-pointer inline-block text-sm sm:text-base">
                  <T tKey="bulkUpload.upload.browse" />
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
              className={`flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 font-semibold rounded-xl transition-all shadow-sm hover:shadow-md text-sm sm:text-base ${
                uploading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800'
              }`}
            >
              {uploading ? (
                <>
                  <div className="w-4 sm:w-5 h-4 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <T tKey="bulkUpload.upload.processing" />
                </>
              ) : (
                <>
                  <ArrowUpTrayIcon className="w-4 sm:w-5 h-4 sm:h-5" />
                  <T tKey="bulkUpload.upload.uploadButton" />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {showResults && uploadResults && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              <T tKey="bulkUpload.results.title" />
            </h3>
            <button
              onClick={() => setShowResults(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-5 sm:w-6 h-5 sm:h-6" />
            </button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
              <div className="text-green-600 text-xs sm:text-sm font-semibold mb-1">
                <T tKey="bulkUpload.results.categoriesCreated" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-green-900">{uploadResults.categories.created}</div>
            </div>
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 sm:p-4">
              <div className="text-neutral-600 text-xs sm:text-sm font-medium mb-1">
                <T tKey="bulkUpload.results.categoriesUpdated" />
              </div>
              <div className="text-2xl sm:text-3xl font-light text-neutral-900">{uploadResults.categories.updated}</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
              <div className="text-green-600 text-xs sm:text-sm font-semibold mb-1">
                <T tKey="bulkUpload.results.productsCreated" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-green-900">{uploadResults.products.created}</div>
            </div>
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 sm:p-4">
              <div className="text-neutral-600 text-xs sm:text-sm font-medium mb-1">
                <T tKey="bulkUpload.results.productsUpdated" />
              </div>
              <div className="text-2xl sm:text-3xl font-light text-neutral-900">{uploadResults.products.updated}</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
              <div className="text-green-600 text-xs sm:text-sm font-semibold mb-1">
                <T tKey="bulkUpload.results.variantsCreated" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-green-900">{uploadResults.variants?.created || 0}</div>
            </div>
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 sm:p-4">
              <div className="text-neutral-600 text-xs sm:text-sm font-medium mb-1">
                <T tKey="bulkUpload.results.variantsUpdated" />
              </div>
              <div className="text-2xl sm:text-3xl font-light text-neutral-900">{uploadResults.variants?.updated || 0}</div>
            </div>
          </div>

          {/* Errors */}
          {uploadResults.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 text-red-900 font-semibold mb-3 text-sm sm:text-base">
                <ExclamationCircleIcon className="w-5 h-5" />
                <T tKey="bulkUpload.results.errors" /> ({uploadResults.errors.length})
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {uploadResults.errors.map((error: any, index: number) => (
                  <div key={index} className="text-xs sm:text-sm text-red-800 bg-white rounded p-2">
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
