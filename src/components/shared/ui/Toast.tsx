'use client';

import React from 'react';
import { Toaster, ToastBar, toast } from 'react-hot-toast';

/**
 * 🔔 ЕДИНЫЙ ТОСТ-МЕНЕДЖЕР
 */
const ToastViewport = () => {
  console.log('🔄 ToastViewport: инициализация глобальных уведомлений');

  return (
    <Toaster
      position="top-center"
      toastOptions={{
        className:
          'rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-lg',
        duration: 4000,
        success: {
          icon: '✅',
        },
        error: {
          icon: '❌',
        },
        loading: {
          icon: '🔄',
        },
      }}
    >
      {(t) => (
        <ToastBar
          toast={t}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          {({ icon, message }) => (
            <>
              <span>{icon}</span>
              <span className="flex-1">{message}</span>
              {t.type !== 'loading' && (
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  Закрыть
                </button>
              )}
            </>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
};

export { ToastViewport };
