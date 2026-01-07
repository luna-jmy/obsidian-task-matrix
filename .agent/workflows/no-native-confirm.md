---
description: Policy and implementation for replacing native window.confirm with custom themed modals to ensure compatibility with preview environments.
---

# Policy: No Native Dialogs

To ensure consistent behavior across all development and preview environments (where native browser dialogs like `window.confirm` may be blocked or hidden), this project enforces the use of custom React-based modals for user confirmation.

## Implementation Steps

### 1. Create the Reusable Component
Create `components/ConfirmModal.tsx` (using Tailwind CSS and Lucide React):

```tsx
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen, onClose, onConfirm, title, message,
    confirmText = 'Confirm', cancelText = 'Cancel', variant = 'danger'
}) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-[#1e1e1e] w-full max-w-md rounded-lg border border-gray-800 shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={20} className={variant === 'danger' ? 'text-red-500' : 'text-blue-500'} />
                        <h3 className="text-lg font-bold text-white uppercase">{title}</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-1 hover:bg-white/5 rounded">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6">
                    <p className="text-gray-300 text-sm">{message}</p>
                </div>
                <div className="p-4 bg-black/20 flex gap-3 justify-end border-t border-gray-800">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white">
                        {cancelText}
                    </button>
                    <button 
                        onClick={() => { onConfirm(); onClose(); }}
                        className={`px-5 py-2 text-sm font-bold text-white rounded ${variant === 'danger' ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
```

### 2. Usage Pattern
In your main `App.tsx` or container component:

```tsx
const [isConfirmOpen, setIsConfirmOpen] = useState(false);

const handleAction = () => {
    setIsConfirmOpen(true);
};

const handleConfirm = () => {
    // Execute critical logic here
    executeDeletion();
};

return (
    <>
        <button onClick={handleAction}>Execute Action</button>
        <ConfirmModal 
            isOpen={isConfirmOpen}
            onClose={() => setIsConfirmOpen(false)}
            onConfirm={handleConfirm}
            title="Are you sure?"
            message="This action cannot be undone."
        />
    </>
);
```

## System Prompt Snippet
Add this to your project instructions or system prompt to enforce this behavior:

> **CRITICAL POLICY: DO NOT USE NATIVE BROWSER DIALOGS**
> Never use `window.alert()`, `window.confirm()`, or `window.prompt()`. These dialogs cause issues in the testing/preview environment.
> Always implement a custom modal component (e.g., `ConfirmModal.tsx`) using React state and CSS for any user confirmation or notification tasks.
