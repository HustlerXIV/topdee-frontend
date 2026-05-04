"use client";

import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type OptionHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";
import { Check, ChevronDown } from "@/components/ui/Icon";

const baseField =
  "w-full rounded-[10px] border border-line2 bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-brand-600 disabled:bg-muted disabled:text-ink-faint";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={cn(baseField, className)} {...rest} />;
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, rows = 4, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(baseField, "resize-y leading-6", className)}
      {...rest}
    />
  );
});

type SelectOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  menuClassName?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    {
      className,
      menuClassName,
      children,
      value,
      defaultValue,
      onChange,
      disabled,
      name,
      required,
      ...rest
    },
    ref,
  ) {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const id = useId();
    const options = optionsFromChildren(children);
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState(
      String(value ?? defaultValue ?? options[0]?.value ?? ""),
    );
    const [open, setOpen] = useState(false);
    const selectedValue = String(isControlled ? value : internalValue);
    const selected =
      options.find((opt) => opt.value === selectedValue) ?? options[0];

    useEffect(() => {
      if (isControlled) setInternalValue(String(value ?? ""));
    }, [isControlled, value]);

    useEffect(() => {
      if (!open) return;
      function onPointerDown(e: MouseEvent) {
        const target = e.target as Node;
        if (
          buttonRef.current?.contains(target) ||
          menuRef.current?.contains(target)
        ) {
          return;
        }
        setOpen(false);
      }
      function onKeyDown(e: KeyboardEvent) {
        if (e.key === "Escape") setOpen(false);
      }
      document.addEventListener("mousedown", onPointerDown);
      document.addEventListener("keydown", onKeyDown);
      return () => {
        document.removeEventListener("mousedown", onPointerDown);
        document.removeEventListener("keydown", onKeyDown);
      };
    }, [open]);

    function commit(next: string) {
      if (!isControlled) setInternalValue(next);
      setOpen(false);
      onChange?.({
        target: { value: next, name },
        currentTarget: { value: next, name },
      } as unknown as ChangeEvent<HTMLSelectElement>);
    }

    return (
      <div className={cn("relative", className)}>
        <select
          ref={ref}
          name={name}
          required={required}
          disabled={disabled}
          value={selectedValue}
          onChange={onChange}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          {...rest}
        >
          {children}
        </select>
        <button
          ref={buttonRef}
          type="button"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            baseField,
            "flex min-h-10 items-center justify-between gap-2 text-left disabled:cursor-not-allowed",
          )}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">
              {selected?.label ?? "Select"}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-ink-faint transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
        {open && (
          <div
            ref={menuRef}
            id={`${id}-listbox`}
            role="listbox"
            className={cn(
              "absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-[12px] border border-line2 bg-card p-1 shadow-[0_16px_40px_rgba(15,23,42,0.14)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.35)]",
              menuClassName,
            )}
          >
            {options.map((opt) => {
              const active = opt.value === selectedValue;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  disabled={opt.disabled}
                  onClick={() => commit(opt.value)}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-[9px] px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                    active
                      ? "bg-brand-soft text-brand-700 dark:text-brand-200"
                      : "text-ink hover:bg-muted",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">
                      {opt.label}
                    </span>
                    {opt.description && (
                      <span className="block text-xs text-ink-faint">
                        {opt.description}
                      </span>
                    )}
                  </span>
                  {active && <Check className="mt-0.5 h-4 w-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  },
);

function optionsFromChildren(children: ReactNode): SelectOption[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child)) return [];
    if (child.type === "option") {
      const option = child as ReactElement<
        OptionHTMLAttributes<HTMLOptionElement> & {
          "data-description"?: string;
        }
      >;
      return [
        {
          value: String(option.props.value ?? option.props.children ?? ""),
          label: textFromNode(option.props.children),
          description: option.props["data-description"],
          disabled: option.props.disabled,
        },
      ];
    }
    if (child.type === "optgroup") {
      return optionsFromChildren(child.props.children);
    }
    return [];
  });
}

function textFromNode(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textFromNode).join("");
  return "";
}

export function FormGroup({
  label,
  hint,
  error,
  children,
  className,
}: {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <span className="text-[13px] font-semibold text-ink">{label}</span>
      )}
      {children}
      {hint && !error && <span className="text-xs text-ink-faint">{hint}</span>}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

export function FormRow({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
  );
}
