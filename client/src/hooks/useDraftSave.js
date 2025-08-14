// src/hooks/useDraftSave.js - 完整修复版
import { useState, useEffect, useCallback, useRef } from 'react';
import { useHapticFeedback } from './useDeviceDetetion';

// IndexedDB 数据库配置
const DB_NAME = 'TaskDraftsDB';
const DB_VERSION = 1;
const STORE_NAME = 'drafts';
const DRAFT_RETENTION_DAYS = 7;

class DraftStorage {
  constructor() {
    this.db = null;
    this.initDB();
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'taskId' });
          store.createIndex('lastSaved', 'lastSaved', { unique: false });
        }
      };
    });
  }

  async ensureDB() {
    if (!this.db) {
      await this.initDB();
    }
    return this.db;
  }

  async saveDraft(taskId, draftData) {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const draft = {
        taskId,
        ...draftData,
        lastSaved: Date.now(),
        version: 1
      };
      
      await store.put(draft);
      return true;
    } catch (error) {
      console.error('保存草稿失败:', error);
      return false;
    }
  }

  async loadDraft(taskId) {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      return new Promise((resolve, reject) => {
        const request = store.get(taskId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('加载草稿失败:', error);
      return null;
    }
  }

  async deleteDraft(taskId) {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      await store.delete(taskId);
      return true;
    } catch (error) {
      console.error('删除草稿失败:', error);
      return false;
    }
  }

  async cleanupExpiredDrafts() {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('lastSaved');
      
      const cutoffTime = Date.now() - (DRAFT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
      const range = IDBKeyRange.upperBound(cutoffTime);
      
      return new Promise((resolve) => {
        const request = index.openCursor(range);
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };
      });
    } catch (error) {
      console.error('清理过期草稿失败:', error);
    }
  }
}

// 创建单例实例
const draftStorage = new DraftStorage();

export const useDraftSave = (taskId, isFullscreen = false) => {
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, error
  const [hasDraft, setHasDraft] = useState(false);
  const [draftData, setDraftData] = useState(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  
  const haptic = useHapticFeedback();
  const saveTimeoutRef = useRef(null);
  const lastSaveDataRef = useRef('');
  
  // 🔥 关键修复：全屏模式下完全禁用所有定时器和自动保存
  const isAutoSaveEnabled = useRef(!isFullscreen);

  // 监听全屏状态变化，立即清理定时器
  useEffect(() => {
    isAutoSaveEnabled.current = !isFullscreen;
    
    if (isFullscreen) {
      // 立即清理所有定时器
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      // 停止任何正在进行的保存操作
      setSaveStatus('idle');
      console.log('🔥 全屏模式：已禁用自动保存');
    } else {
      console.log('🔥 非全屏模式：已启用自动保存');
    }
  }, [isFullscreen]);

  // 检查是否有草稿
  const checkForDraft = useCallback(async () => {
    if (!taskId) return;
    
    try {
      // 清理过期草稿
      await draftStorage.cleanupExpiredDrafts();
      
      // 检查当前任务的草稿
      const draft = await draftStorage.loadDraft(taskId);
      if (draft) {
        setHasDraft(true);
        setDraftData(draft);
        setShowRestoreDialog(true);
      }
    } catch (error) {
      console.error('检查草稿失败:', error);
    }
  }, [taskId]);

  // 保存草稿 - 添加全屏状态检查
  const saveDraft = useCallback(async (data, isManual = false) => {
    if (!taskId || !data) return false;

    // 🔥 全屏模式下只允许手动保存
    if (isFullscreen && !isManual) {
      console.log('🔥 全屏模式下跳过自动保存');
      return false;
    }

    // 检查数据是否有变化
    const currentDataStr = JSON.stringify(data);
    if (currentDataStr === lastSaveDataRef.current && !isManual) {
      return false;
    }

    setSaveStatus('saving');
    
    try {
      // 处理图片数据 - 转换为可存储的格式
      const processedImages = await Promise.all(
        (data.images || []).map(async (image) => {
          if (image instanceof File) {
            return {
              file: image,
              name: image.name,
              size: image.size,
              type: image.type,
              lastModified: image.lastModified
            };
          }
          return image;
        })
      );

      const draftPayload = {
        content: data.content || '',
        images: processedImages,
        fileInfo: data.fileInfo || {
          hasFile: !!data.file,
          fileName: data.file?.name || '',
          fileSize: data.file ? formatFileSize(data.file.size) : '',
          fileType: data.file?.type || ''
        },
        aigcLog: data.aigcLog || [],
        model: data.model || 'qwen',
        shouldUploadAIGC: data.shouldUploadAIGC || false
      };

      const success = await draftStorage.saveDraft(taskId, draftPayload);
      
      if (success) {
        setSaveStatus('saved');
        lastSaveDataRef.current = currentDataStr;
        
        if (isManual) {
          haptic.success();
        }
        
        // 2秒后恢复idle状态
        setTimeout(() => setSaveStatus('idle'), 2000);
        return true;
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
        return false;
      }
    } catch (error) {
      console.error('保存草稿失败:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return false;
    }
  }, [taskId, haptic, isFullscreen]);

  // 防抖的自动保存 - 加强全屏检查
  const debouncedSave = useCallback((data) => {
    // 🔥 双重检查：当前状态 + ref状态
    if (isFullscreen || !isAutoSaveEnabled.current) {
      console.log('🔥 跳过自动保存：全屏模式或已禁用');
      return;
    }
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      // 🔥 执行前再次检查全屏状态
      if (!isFullscreen && isAutoSaveEnabled.current) {
        console.log('🔥 执行自动保存');
        saveDraft(data, false);
      } else {
        console.log('🔥 取消自动保存：状态已变化');
      }
    }, 3000);
  }, [isFullscreen, saveDraft]);

  // 手动保存
  const manualSave = useCallback((data) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    console.log('🔥 执行手动保存');
    return saveDraft(data, true);
  }, [saveDraft]);

  // 恢复草稿
  const restoreDraft = useCallback(() => {
    setShowRestoreDialog(false);
    return draftData;
  }, [draftData]);

  // 忽略草稿
  const ignoreDraft = useCallback(async () => {
    setShowRestoreDialog(false);
    setHasDraft(false);
    await draftStorage.deleteDraft(taskId);
  }, [taskId]);

  // 删除草稿
  const deleteDraft = useCallback(async () => {
    await draftStorage.deleteDraft(taskId);
    setHasDraft(false);
    setDraftData(null);
  }, [taskId]);

  // 页面离开前检查
  const checkBeforeLeave = useCallback((currentData) => {
    if (!currentData) return false;
    
    const hasContent = !!(
      currentData.content?.trim() ||
      currentData.images?.length > 0 ||
      currentData.file ||
      currentData.aigcLog?.length > 0
    );
    
    return hasContent;
  }, []);

  // 初始化检查草稿
  useEffect(() => {
    checkForDraft();
  }, [checkForDraft]);

  // 🔥 加强清理逻辑
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      isAutoSaveEnabled.current = false;
      console.log('🔥 组件卸载：已清理所有定时器');
    };
  }, []);

  return {
    saveStatus,
    hasDraft,
    showRestoreDialog,
    draftData,
    debouncedSave,
    manualSave,
    restoreDraft,
    ignoreDraft,
    deleteDraft,
    checkBeforeLeave
  };
};

// 工具函数
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}