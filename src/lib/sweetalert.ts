import Swal from "sweetalert2";

const base = Swal.mixin({
  buttonsStyling: false,
  customClass: {
    confirmButton: "inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 mx-1",
    cancelButton: "inline-flex items-center justify-center rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 mx-1",
    denyButton: "inline-flex items-center justify-center rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4 mx-1",
    popup: "rounded-xl",
  },
});

export const swalSuccess = (title: string, text?: string) =>
  base.fire({ icon: "success", title, text, confirmButtonText: "OK" });

export const swalError = (title: string, text?: string) =>
  base.fire({ icon: "error", title, text, confirmButtonText: "OK" });

export const swalInfo = (title: string, text?: string) =>
  base.fire({ icon: "info", title, text, confirmButtonText: "OK" });

export const swalConfirm = (title: string, text?: string) =>
  base.fire({
    icon: "question",
    title,
    text,
    showCancelButton: true,
    confirmButtonText: "Yes",
    cancelButtonText: "Cancel",
  });

export const swalToast = base.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
});