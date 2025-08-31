import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { supabase } from "@/supabaseClient";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUploaded?: (permanentUrl: string) => void;
};

export function ProfileImageCropper({ open, onOpenChange, onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imageSize, setImageSize] = useState<{ w: number; h: number } | null>(null);

  // Transform state (relative to a 300x300 viewport)
  const viewportSize = 300;
  const [scale, setScale] = useState<number>(1); // user scale multiplier
  const [minScale, setMinScale] = useState<number>(1);
  const [tx, setTx] = useState<number>(0); // px translation X
  const [ty, setTy] = useState<number>(0); // px translation Y
  const dragging = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setPreviewUrl(null);
      setImageSize(null);
      setScale(1);
      setTx(0);
      setTy(0);
    }
  }, [open]);

  const baseCoverScale = useMemo(() => {
    if (!imageSize) return 1;
    const cover = Math.max(viewportSize / imageSize.w, viewportSize / imageSize.h);
    return cover;
  }, [imageSize]);

  useEffect(() => {
    if (!imageSize) return;
    setMinScale(1); // user scale minimum is 1, combined = baseCoverScale * 1
    setScale(1);
    setTx(0);
    setTy(0);
  }, [imageSize]);

  const combinedScale = (baseCoverScale || 1) * scale;

  function clampTranslation(nx: number, ny: number) {
    if (!imageSize) return { x: 0, y: 0 };
    const imgW = imageSize.w * combinedScale;
    const imgH = imageSize.h * combinedScale;
    const maxX = Math.max(0, (imgW - viewportSize) / 2);
    const maxY = Math.max(0, (imgH - viewportSize) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, nx)),
      y: Math.max(-maxY, Math.min(maxY, ny)),
    };
  }

  function onPointerDown(e: React.PointerEvent) {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    lastPos.current = { x: e.clientX, y: e.clientY };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current || !lastPos.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    const clamped = clampTranslation(tx + dx, ty + dy);
    setTx(clamped.x);
    setTy(clamped.y);
  }

  function onPointerUp(e: React.PointerEvent) {
    dragging.current = false;
    lastPos.current = null;
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const dir = e.deltaY > 0 ? -1 : 1;
    const step = 0.08 * dir;
    const next = Math.max(minScale, Math.min(3, scale + step));
    setScale(next);
    // after scale change, also clamp translation
    const clamped = clampTranslation(tx, ty);
    setTx(clamped.x);
    setTy(clamped.y);
  }

  function computeSourceRect() {
    if (!imageSize) return { sx: 0, sy: 0, sw: imageSize?.w || 0, sh: imageSize?.h || 0 };
    // container top-left in image space
    const cx = viewportSize / 2;
    const cy = viewportSize / 2;
    const sx = (0 - (cx + tx)) / combinedScale + imageSize.w / 2;
    const sy = (0 - (cy + ty)) / combinedScale + imageSize.h / 2;
    const sw = viewportSize / combinedScale;
    const sh = viewportSize / combinedScale;
    return { sx, sy, sw, sh };
  }

  async function handleUpload() {
    if (!previewUrl || !imageSize) return;
    // Render crop to 512x512 canvas
    const canvas = document.createElement('canvas');
    const outSize = 512;
    canvas.width = outSize;
    canvas.height = outSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imgRef.current;
    if (!img) return;

    const { sx, sy, sw, sh } = computeSourceRect();
    // Clamp source rect within image bounds
    const csx = Math.max(0, Math.min(imageSize.w - 1, sx));
    const csy = Math.max(0, Math.min(imageSize.h - 1, sy));
    const csw = Math.max(1, Math.min(imageSize.w - csx, sw));
    const csh = Math.max(1, Math.min(imageSize.h - csy, sh));

    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, csx, csy, csw, csh, 0, 0, outSize, outSize);

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    if (!blob) return;

    // Get upload URL for profile picture
    const uploadRes = await apiRequest('POST', '/api/user/profile-picture/upload');
    const { uploadURL } = await uploadRes.json();

    // Upload blob with auth header so server accepts it
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    const put = await fetch(uploadURL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/jpeg',
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
      },
      credentials: 'include',
      body: blob,
    });
    if (!put.ok) {
      const t = await put.text().catch(() => '');
      throw new Error(`Upload failed: ${put.status} ${put.statusText} ${t}`);
    }

    // Try to obtain objectPath from either the uploadURL (preferred) or PUT response JSON
    let objectPath: string | null = null;
    try {
      const u = new URL(uploadURL, window.location.origin);
      objectPath = u.searchParams.get('objectPath');
    } catch {
      objectPath = null;
    }
    if (!objectPath) {
      try {
        const putJson = await put.clone().json();
        objectPath = putJson?.objectPath || null;
      } catch {
        // ignore
      }
    }

    // Notify server to set profile image and return the public URL
    const finalizeRes = await apiRequest('PUT', '/api/user/profile-picture', { profileImageUrl: uploadURL });
    const finalizeJson = await finalizeRes.json();
    let publicUrl: string = finalizeJson.profileImageUrl || '';

    // Fallback: build public URL client-side if server didn't return it yet
    if ((!publicUrl || !/^https?:\/\//.test(publicUrl)) && objectPath) {
      const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
      const bucket = ((import.meta as any).env?.VITE_SUPABASE_STORAGE_BUCKET as string | undefined) || 'verifund-assets';
      if (supabaseUrl) {
        publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${objectPath}`;
      }
    }

    onUploaded?.(publicUrl);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Update Profile Picture</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Choose image</Label>
            <Input type="file" accept="image/*" onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setFile(f);
            }} />
          </div>

          {previewUrl && (
            <div className="space-y-2">
              <div
                className="relative mx-auto border rounded-lg bg-black/5"
                style={{ width: viewportSize, height: viewportSize, overflow: 'hidden' }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onWheel={onWheel}
              >
                {/* Hidden natural image to capture natural size */}
                <img
                  ref={imgRef}
                  src={previewUrl}
                  alt="preview"
                  className="select-none" 
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(${combinedScale})`,
                    transformOrigin: 'center center',
                    userSelect: 'none',
                    pointerEvents: 'none',
                  }}
                  onLoad={(e) => {
                    const el = e.currentTarget;
                    setImageSize({ w: el.naturalWidth, h: el.naturalHeight });
                  }}
                  draggable={false}
                />
              </div>
              <div className="flex items-center gap-3">
                <Label className="w-16 text-xs">Zoom</Label>
                <input
                  type="range"
                  min={minScale}
                  max={3}
                  step={0.01}
                  value={scale}
                  onChange={(e) => {
                    const next = parseFloat(e.target.value);
                    setScale(next);
                    const c = clampTranslation(tx, ty);
                    setTx(c.x);
                    setTy(c.y);
                  }}
                  className="w-full"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleUpload} disabled={!file}>Crop & Upload</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


