import React, { useState, useEffect, useRef } from 'react';
import { generateHeadshot } from '../services/geminiService';
import { DownloadIcon, RefreshIcon, UploadIcon, XIcon } from './icons';

const loadingMessages = [
    "Warming up the studio lights...",
    "Adjusting the camera lens...",
    "Finding the perfect angle...",
    "Applying professional touch-ups...",
    "Developing the photo in the digital darkroom...",
    "Polishing the final image...",
];

const LoadingState: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center text-center p-8 min-h-[300px]">
        <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-6"></div>
        <p className="text-xl font-semibold text-white">{message}</p>
        <p className="text-gray-400 mt-2">Please wait, this can take a minute.</p>
    </div>
);

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
    });
};

const ImageGenerator: React.FC = () => {
    const [description, setDescription] = useState<string>('');
    const [sourceImageFile, setSourceImageFile] = useState<File | null>(null);
    const [sourceImagePreview, setSourceImagePreview] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState<string>(loadingMessages[0]);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
        if (isLoading) {
            intervalRef.current = window.setInterval(() => {
                setLoadingMessage(prev => {
                    const currentIndex = loadingMessages.indexOf(prev);
                    const nextIndex = (currentIndex + 1) % loadingMessages.length;
                    return loadingMessages[nextIndex];
                });
            }, 3000);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isLoading]);

    useEffect(() => {
        return () => {
            if (sourceImagePreview) {
                URL.revokeObjectURL(sourceImagePreview);
            }
        };
    }, [sourceImagePreview]);

    const handleFileSelect = (file: File | null) => {
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Please upload a valid image file (PNG, JPG, WEBP).');
                return;
            }
            if (sourceImagePreview) {
                 URL.revokeObjectURL(sourceImagePreview);
            }
            setSourceImageFile(file);
            setSourceImagePreview(URL.createObjectURL(file));
            setError(null);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileSelect(e.target.files?.[0] ?? null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };
    
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFileSelect(e.dataTransfer.files?.[0] ?? null);
    };

    const clearSourceImage = () => {
        setSourceImageFile(null);
        setSourceImagePreview(null); // useEffect cleanup will revoke
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    
    const handleGenerate = async () => {
        if (!sourceImageFile) {
            setError("Please upload an image to start.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        setLoadingMessage(loadingMessages[0]);

        try {
            const base64Image = await fileToBase64(sourceImageFile);
            const imageUrl = await generateHeadshot(base64Image, sourceImageFile.type, description);
            setGeneratedImage(imageUrl);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unexpected error occurred.");
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDownload = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = 'ai-headshot.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleStartOver = () => {
        setDescription('');
        setGeneratedImage(null);
        setError(null);
        setIsLoading(false);
        clearSourceImage();
    };

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-700 w-full">
            {isLoading ? (
                <LoadingState message={loadingMessage} />
            ) : generatedImage ? (
                <div className="flex flex-col items-center">
                    <h2 className="text-2xl font-semibold text-center text-white mb-4">Your Headshot is Ready!</h2>
                    <div className="relative group w-full max-w-lg aspect-square">
                        <img src={generatedImage} alt="Generated headshot" className="rounded-xl w-full h-full object-cover shadow-lg" />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 mt-6 w-full max-w-lg">
                        <button
                            onClick={handleDownload}
                            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                        >
                            <DownloadIcon />
                            Download
                        </button>
                        <button
                            onClick={handleStartOver}
                            className="flex-1 flex items-center justify-center gap-2 bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                        >
                            <RefreshIcon />
                            Start Over
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {sourceImagePreview ? (
                        <div className="relative w-full max-w-sm mx-auto">
                            <img src={sourceImagePreview} alt="Source for headshot" className="rounded-xl w-full h-auto object-contain max-h-72 shadow-lg" />
                            <button onClick={clearSourceImage} className="absolute -top-3 -right-3 bg-gray-700 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50" aria-label="Remove image">
                                <XIcon />
                            </button>
                        </div>
                    ) : (
                        <div 
                            onDragOver={handleDragOver} 
                            onDrop={handleDrop}
                            onDragLeave={handleDragLeave}
                            className={`flex justify-center items-center w-full px-6 py-10 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? 'border-blue-500 bg-gray-800' : 'border-gray-600 hover:border-gray-500'}`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="text-center">
                                <UploadIcon />
                                <p className="mt-2 text-lg font-medium text-gray-300">
                                    Drag & drop an image or click to upload
                                </p>
                                <p className="mt-1 text-sm text-gray-500">PNG, JPG, or WEBP</p>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/png, image/jpeg, image/webp"
                                    className="hidden"
                                    id="file-upload"
                                />
                            </div>
                        </div>
                    )}
                    <div>
                        <label htmlFor="description" className="block text-lg font-medium text-gray-300 mb-2">
                            Optional instructions
                        </label>
                        <textarea
                            id="description"
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g., Wear a black suit, change background to a blurred office..."
                            className="w-full p-4 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                        />
                    </div>
                    {error && <p className="text-red-400 text-center bg-red-900/50 p-3 rounded-lg">{error}</p>}
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !sourceImageFile}
                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-4 px-6 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Generate Headshot
                    </button>
                </div>
            )}
        </div>
    );
};

export default ImageGenerator;