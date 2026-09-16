import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/forms/NumberInput";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { cn } from "@/lib/utils";

interface FormTextFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  type?: string;
  placeholder?: string;
  min?: number;
  size?: "default" | "sm";
  labelClassName?: string;
  itemClassName?: string;
  inputClassName?: string;
}

export function FormTextField<T extends FieldValues>({
  control,
  name,
  label,
  type = "text",
  placeholder,
  min,
  size = "default",
  labelClassName,
  itemClassName,
  inputClassName,
}: FormTextFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={itemClassName}>
          <FormLabel
            className={cn(
              "text-xs font-semibold text-muted-foreground",
              labelClassName,
            )}
          >
            {label}
          </FormLabel>
          <FormControl>
            {type === "number" ? (
              <NumberInput
                min={min}
                placeholder={placeholder}
                className={cn(
                  size === "sm" && "h-9 text-xs",
                  inputClassName,
                )}
                name={field.name}
                value={field.value ?? 0}
                onBlur={field.onBlur}
                onChange={field.onChange}
              />
            ) : (
              <Input
                type={type}
                min={min}
                placeholder={placeholder}
                className={cn(
                  size === "sm" && "h-9 text-xs",
                  inputClassName,
                )}
                {...field}
                value={field.value ?? ""}
                onChange={(event) => field.onChange(event.target.value)}
              />
            )}
          </FormControl>
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );
}
