import React from 'react';
import Modal from './Modal';
import PropertyPage from '../pages/PropertyPage';
import html2pdf from 'html2pdf.js';

interface PropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string | null;
}

export default function PropertyModal({ isOpen, onClose, slug }: PropertyModalProps) {
  if (!slug) {
      return null;
  }

  const donwloadPDF = async () => {
      const mainElement = document.getElementById('property-main-page');
      const opt = {
          margin:       1,
          filename:     `${slug}.pdf`,
          image:        { type: 'png', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true },
          // pageBreak: { mode: 'avoid-all', after: '#property-details' },
      };
      await html2pdf().set(opt).from(mainElement).save();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth={'600'}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Property Details</h2>
        <button
          onClick={donwloadPDF} // Replace with actual PDF download logic
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Download as PDF
        </button>
      </div>
      <PropertyPage withNearByPlaces={false} slug={slug} />
    </Modal>
  );
}
