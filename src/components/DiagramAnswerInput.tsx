"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useAccessibility } from "@/context/AccessibilityContext";
import {
    Pencil,
    Eraser,
    Trash2,
    Upload,
    Palette,
    Minus,
    Plus,
    Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DiagramAnswerInputProps {
    questionId: string;
    questionPrompt: string;
    value: string;
    onChange: (value: string) => void;
}

type Tool = "pen" | "eraser";

const COLOURS = ["#111111", "#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6"];

export function DiagramAnswerInput({
    questionId,
    questionPrompt,
    value,
    onChange,
}: DiagramAnswerInputProps) {
    const { largeInteractionMode, highContrast, disabilityType } = useAccessibility();
    const isMotor = disabilityType === "MOTOR";

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [tool, setTool] = useState<Tool>("pen");
    const [colour, setColour] = useState("#111111");
    const [strokeSize, setStrokeSize] = useState(3);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawing, setHasDrawing] = useState(false);
    const lastPos = useRef<{ x: number; y: number } | null>(null);

    // ── Canvas helpers ──────────────────────────────────────────────

    const getCtx = () => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const ctx = canvas.getContext("2d");
        return ctx;
    };

    // Initialise white background on mount
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, []);

    const getPos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        if ("touches" in e) {
            const touch = e.touches[0];
            return {
                x: (touch.clientX - rect.left) * scaleX,
                y: (touch.clientY - rect.top) * scaleY,
            };
        }
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    };

    const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const pos = getPos(e);
        if (!pos) return;
        setIsDrawing(true);
        lastPos.current = pos;
        setHasDrawing(true);
    };

    const draw = useCallback(
        (e: React.MouseEvent | React.TouchEvent) => {
            e.preventDefault();
            if (!isDrawing) return;
            const pos = getPos(e);
            if (!pos || !lastPos.current) return;
            const ctx = getCtx();
            if (!ctx) return;

            ctx.beginPath();
            ctx.moveTo(lastPos.current.x, lastPos.current.y);
            ctx.lineTo(pos.x, pos.y);
            ctx.strokeStyle = tool === "eraser" ? "#ffffff" : colour;
            ctx.lineWidth = tool === "eraser" ? strokeSize * 6 : strokeSize;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.stroke();
            lastPos.current = pos;
        },
        [isDrawing, tool, colour, strokeSize]
    );

    const endDraw = () => {
        setIsDrawing(false);
        lastPos.current = null;
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = getCtx();
        if (!canvas || !ctx) return;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setHasDrawing(false);
    };

    // ── Image upload ─────────────────────────────────────────────────

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const canvas = canvasRef.current;
        const ctx = getCtx();
        if (!canvas || !ctx) return;

        const img = new window.Image();
        img.onload = () => {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            // Fit image proportionally
            const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
            const w = img.width * scale;
            const h = img.height * scale;
            const x = (canvas.width - w) / 2;
            const y = (canvas.height - h) / 2;
            ctx.drawImage(img, x, y, w, h);
            setHasDrawing(true);
        };
        img.src = URL.createObjectURL(file);
    };

    // ── Sync canvas image to answer (as data-URL prefix) ─────────────
    // The grading engine grades the *text description*, not the raw image.
    // We store "data:[image];[text description]" so both parts are preserved.

    const syncCanvasToAnswer = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL("image/png");
        // Preserve any existing text description after the separator
        const existing = value || "";
        const sep = existing.indexOf("\n---DESCRIPTION---\n");
        const description = sep >= 0 ? existing.slice(sep + 19) : existing;
        onChange(`${dataUrl}\n---DESCRIPTION---\n${description}`);
    };

    // Extract current text description from stored value
    const getDescription = () => {
        const sep = value.indexOf("\n---DESCRIPTION---\n");
        if (sep >= 0) return value.slice(sep + 19);
        // If no canvas prefix yet, the whole value is the description
        return value.startsWith("data:") ? "" : value;
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const desc = e.target.value;
        const sep = value.indexOf("\n---DESCRIPTION---\n");
        if (sep >= 0) {
            // Keep canvas data, update description
            onChange(value.slice(0, sep + 19) + desc);
        } else {
            onChange(desc);
        }
    };

    const hasCanvasData = value.startsWith("data:");

    const btnBase = cn(
        "flex items-center gap-1.5 rounded-lg border border-neutral-200 transition-all font-medium",
        "hover:border-neutral-400 hover:bg-neutral-50",
        "[.high-contrast_&]:!border-white [.high-contrast_&]:!text-white [.high-contrast_&]:!bg-black",
        isMotor || largeInteractionMode ? "h-12 px-4 text-base" : "h-9 px-3 text-sm"
    );
    const btnActive = "!border-neutral-900 !bg-neutral-900 !text-white [.high-contrast_&]:!bg-white [.high-contrast_&]:!text-black";

    return (
        <div className="w-full space-y-4">
            {/* ── Canvas toolbar ────────────────────────────────── */}
            <div
                role="toolbar"
                aria-label="Drawing tools"
                className="flex items-center gap-2 flex-wrap"
            >
                {/* Tool: pen */}
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setTool("pen")}
                    aria-pressed={tool === "pen"}
                    aria-label="Pen tool"
                    className={cn(btnBase, tool === "pen" && btnActive)}
                >
                    <Pencil className="w-4 h-4" aria-hidden="true" />
                    <span className={largeInteractionMode ? "" : "hidden sm:inline"}>Pen</span>
                </Button>

                {/* Tool: eraser */}
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setTool("eraser")}
                    aria-pressed={tool === "eraser"}
                    aria-label="Eraser tool"
                    className={cn(btnBase, tool === "eraser" && btnActive)}
                >
                    <Eraser className="w-4 h-4" aria-hidden="true" />
                    <span className={largeInteractionMode ? "" : "hidden sm:inline"}>Eraser</span>
                </Button>

                {/* Stroke size */}
                <div
                    className="flex items-center gap-1 border border-neutral-200 rounded-lg px-2 [.high-contrast_&]:!border-white"
                    role="group"
                    aria-label="Stroke size"
                >
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setStrokeSize(s => Math.max(1, s - 1))}
                        aria-label="Decrease stroke size"
                        className="h-8 w-8 p-0 rounded hover:bg-neutral-100 [.high-contrast_&]:!text-white"
                    >
                        <Minus className="w-3 h-3" aria-hidden="true" />
                    </Button>
                    <span className="text-xs font-semibold w-5 text-center text-neutral-600 [.high-contrast_&]:!text-white" aria-label={`Stroke size ${strokeSize}`}>{strokeSize}</span>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setStrokeSize(s => Math.min(20, s + 1))}
                        aria-label="Increase stroke size"
                        className="h-8 w-8 p-0 rounded hover:bg-neutral-100 [.high-contrast_&]:!text-white"
                    >
                        <Plus className="w-3 h-3" aria-hidden="true" />
                    </Button>
                </div>

                {/* Colour picker */}
                {!highContrast && (
                    <div className="flex items-center gap-1" role="group" aria-label="Pen colour">
                        <Palette className="w-4 h-4 text-neutral-400 shrink-0" aria-hidden="true" />
                        {COLOURS.map(c => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setColour(c)}
                                aria-label={`Set colour to ${c}`}
                                aria-pressed={colour === c}
                                className={cn(
                                    "w-6 h-6 rounded-full border-2 transition-all focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-1",
                                    colour === c ? "border-neutral-900 scale-125" : "border-transparent hover:scale-110"
                                )}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                )}

                <div className="flex-1" />

                {/* Upload image */}
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Upload an image to draw on"
                    className={btnBase}
                >
                    <Upload className="w-4 h-4" aria-hidden="true" />
                    <span className={largeInteractionMode ? "" : "hidden sm:inline"}>Upload Image</span>
                </Button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    aria-hidden="true"
                    onChange={handleImageUpload}
                    tabIndex={-1}
                />

                {/* Sync to answer */}
                {hasDrawing && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={syncCanvasToAnswer}
                        aria-label="Save the drawing as your answer"
                        className={cn(btnBase, "border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white")}
                    >
                        <ImageIcon className="w-4 h-4" aria-hidden="true" />
                        <span>Save Drawing</span>
                    </Button>
                )}

                {/* Clear */}
                <Button
                    type="button"
                    variant="outline"
                    onClick={clearCanvas}
                    aria-label="Clear the canvas"
                    className={cn(btnBase, "text-red-600 border-red-200 hover:bg-red-50 hover:border-red-400 [.high-contrast_&]:!text-red-400 [.high-contrast_&]:!border-red-400")}
                >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    <span className={largeInteractionMode ? "" : "hidden sm:inline"}>Clear</span>
                </Button>
            </div>

            {/* ── Canvas ──────────────────────────────────────────── */}
            <div className="relative rounded-xl overflow-hidden border-2 border-neutral-200 [.high-contrast_&]:!border-white bg-white touch-none">
                <canvas
                    ref={canvasRef}
                    width={900}
                    height={500}
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={endDraw}
                    onMouseLeave={endDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={endDraw}
                    aria-label={`Drawing canvas for: ${questionPrompt}`}
                    role="img"
                    tabIndex={0}
                    className={cn(
                        "w-full cursor-crosshair touch-none select-none",
                        tool === "eraser" && "cursor-cell",
                        largeInteractionMode ? "h-[400px]" : "h-[320px]"
                    )}
                    style={{ display: "block" }}
                />
                {/* Empty-state hint */}
                {!hasDrawing && (
                    <div
                        className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none text-neutral-300 select-none"
                        aria-hidden="true"
                    >
                        <Pencil className="w-10 h-10" />
                        <p className="text-sm font-medium">Draw your diagram here</p>
                        <p className="text-xs">or upload an image above</p>
                    </div>
                )}
            </div>

            {/* Canvas saved indicator */}
            {hasCanvasData && (
                <p role="status" className="text-xs text-neutral-400 flex items-center gap-1 [.high-contrast_&]:!text-gray-400">
                    <ImageIcon className="w-3 h-3" aria-hidden="true" />
                    Drawing saved to your answer.
                </p>
            )}

            {/* ── Text description ─────────────────────────────────── */}
            <div className="space-y-1.5">
                <label
                    htmlFor={`diagram-desc-${questionId}`}
                    className={cn(
                        "block font-semibold text-neutral-700 [.high-contrast_&]:!text-white",
                        largeInteractionMode ? "text-xl" : "text-sm"
                    )}
                >
                    Written description
                    <span className="ml-1 font-normal text-neutral-400 [.high-contrast_&]:!text-gray-400 text-xs">
                        (required for grading — describe your diagram in words)
                    </span>
                </label>
                <textarea
                    id={`diagram-desc-${questionId}`}
                    value={getDescription()}
                    onChange={handleDescriptionChange}
                    placeholder="Describe your diagram here. E.g. 'The diagram shows a CPU with ALU connected to registers via an internal bus...'"
                    aria-label={`Written description for diagram answer to: ${questionPrompt}`}
                    aria-required="true"
                    className={cn(
                        "w-full p-4 rounded-xl border-2 focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/15 outline-none resize-y transition-all",
                        "[.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white [.high-contrast_&]:!border-white",
                        largeInteractionMode ? "min-h-[160px] text-xl leading-loose" : "min-h-[120px] text-base",
                        "border-neutral-200"
                    )}
                />
                <p className="text-xs text-neutral-400 [.high-contrast_&]:!text-gray-500">
                    Your answer will be graded using the written description. The drawing is supporting context.
                </p>
            </div>
        </div>
    );
}
