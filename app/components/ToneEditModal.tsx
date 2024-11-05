'use client';

interface ToneEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, description: string) => void;
  initialTitle: string;
  initialDescription: string;
  position: 'top' | 'right' | 'bottom' | 'left';
}

const ToneEditModal: React.FC<ToneEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTitle,
  initialDescription,
  position
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
        <h3 className="text-lg font-bold mb-4">Edit {position} tone</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md"
              defaultValue={initialTitle}
              id="title-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
              defaultValue={initialDescription}
              id="description-input"
            />
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                const titleInput = document.getElementById('title-input') as HTMLInputElement;
                const descInput = document.getElementById('description-input') as HTMLTextAreaElement;
                onSave(titleInput.value, descInput.value);
              }}
              className="px-4 py-2 text-sm bg-black text-white rounded hover:bg-gray-800"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToneEditModal; 