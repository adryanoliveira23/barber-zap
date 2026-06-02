"use client";

import React, { useEffect, createContext, useContext, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "./button";

interface DialogContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

// Simple dialog props (legacy API)
interface SimpleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

// Compound dialog props
interface CompoundDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type DialogProps = SimpleDialogProps | CompoundDialogProps;

export const Dialog: React.FC<DialogProps> = (props) => {
  // Check if it's simple dialog (has isOpen prop)
  if ("isOpen" in props) {
    const { isOpen, onClose, title, children, size = "md" } = props;
    const sizes = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-xl" };
    
    useEffect(() => {
      if (isOpen) document.body.style.overflow = "hidden";
      else document.body.style.overflow = "";
      return () => { document.body.style.overflow = ""; };
    }, [isOpen]);
    
    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-obsidian-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.35 }}
              className={`w-full ${sizes[size]} glass-panel rounded-2xl border border-zinc-800 shadow-2xl relative z-10 overflow-hidden`}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/40">
                <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-200">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">{children}</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }
  
  // Compound dialog
  const { children, open: controlledOpen, onOpenChange } = props;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  
  const setOpen = (value: boolean) => {
    if (!isControlled) setUncontrolledOpen(value);
    onOpenChange?.(value);
  };
  
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  
  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
};

export const DialogTrigger: React.FC<{ children: React.ReactNode; asChild?: boolean }> = ({ children }) => {
  const context = useContext(DialogContext);
  if (!context) throw new Error("DialogTrigger must be used within Dialog");
  return <div onClick={() => context.setOpen(true)} className="cursor-pointer">{children}</div>;
};

export const DialogContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => {
  const context = useContext(DialogContext);
  if (!context) throw new Error("DialogContent must be used within Dialog");
  if (!context.open) return null;
  
  return (
    <AnimatePresence>
      {context.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => context.setOpen(false)}
            className="fixed inset-0 bg-obsidian-950/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.35 }}
            className={`w-full max-w-md glass-panel rounded-2xl border border-zinc-800 shadow-2xl relative z-10 overflow-hidden ${className}`}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const DialogHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-6 py-4 border-b border-zinc-800/40">{children}</div>
);

export const DialogTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-base font-semibold text-zinc-100">{children}</h3>
);

export const DialogDescription: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-sm text-zinc-400 mt-1">{children}</p>
);

export const DialogFooter: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-6 py-4 border-t border-zinc-800/40 flex justify-end gap-2">{children}</div>
);

export const DialogClose: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const context = useContext(DialogContext);
  if (!context) throw new Error("DialogClose must be used within Dialog");
  return <div onClick={() => context.setOpen(false)}>{children || <X className="h-4 w-4" />}</div>;
};
