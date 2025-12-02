import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

const ImageCropModal = ({ isOpen, onClose, imageSrc, onCropComplete, aspectRatio = 1 }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropChange = useCallback((crop) => {
        setCrop(crop);
    }, []);

    const onZoomChange = useCallback((zoom) => {
        setZoom(zoom);
    }, []);

    const onCropCompleteCallback = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const getCroppedImg = async (imageSrc, pixelCrop) => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const maxSize = Math.max(image.width, image.height);
        const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

        canvas.width = safeArea;
        canvas.height = safeArea;

        ctx.translate(safeArea / 2, safeArea / 2);
        ctx.translate(-safeArea / 2, -safeArea / 2);

        ctx.drawImage(
            image,
            safeArea / 2 - image.width * 0.5,
            safeArea / 2 - image.height * 0.5
        );
        const data = ctx.getImageData(0, 0, safeArea, safeArea);

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.putImageData(
            data,
            Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
            Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
        );

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/jpeg', 0.95);
        });
    };

    const createImage = (url) =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.src = url;
        });

    const handleSave = async () => {
        if (!croppedAreaPixels) {
            return;
        }

        setIsProcessing(true);
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
            const file = new File([croppedImage], 'cropped-image.jpg', {
                type: 'image/jpeg',
                lastModified: Date.now()
            });
            onCropComplete(file);
            onClose();
        } catch (error) {
            console.error('Error cropping image:', error);
            alert('Ошибка при обрезке изображения');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen || !imageSrc) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="bg-green-98 rounded-custom-small p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
                <div className="mb-4 flex justify-between items-center">
                    <h2 className="text-green-30 font-sf-rounded font-bold text-2xl">
                        Обрезка изображения
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-green-40 hover:text-green-30 text-2xl font-bold"
                    >
                        ×
                    </button>
                </div>

                <div className="relative w-full h-96 mb-4 bg-green-90 rounded-custom-small overflow-hidden">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspectRatio}
                        onCropChange={onCropChange}
                        onZoomChange={onZoomChange}
                        onCropComplete={onCropCompleteCallback}
                        cropShape="rect"
                        showGrid={true}
                        style={{
                            containerStyle: {
                                width: '100%',
                                height: '100%',
                                position: 'relative'
                            }
                        }}
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-green-40 font-inter font-medium text-sm mb-2">
                        Масштаб: {Math.round(zoom * 100)}%
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="3"
                        step="0.1"
                        value={zoom}
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                        className="w-full"
                    />
                </div>

                <div className="flex gap-4 justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-green-90 text-green-40 font-sf-rounded font-semibold rounded-custom-small hover:bg-green-80 transition-colors"
                        disabled={isProcessing}
                    >
                        Отмена
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isProcessing}
                        className="px-6 py-3 bg-green-50 text-green-100 font-sf-rounded font-semibold rounded-custom-small hover:bg-green-60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? 'Обработка...' : 'Сохранить'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageCropModal;

