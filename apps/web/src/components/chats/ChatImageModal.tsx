import { Image, Modal } from '@mantine/core';

type ChatImageModalProps = {
  opened: boolean;
  imageUrl: string;
  alt?: string;
  onClose: () => void;
};

export default function ChatImageModal({ opened, imageUrl, alt = 'Preview image', onClose }: ChatImageModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Aperçu de l'image" centered size="auto" withCloseButton>
      <Image src={imageUrl} alt={alt} fit="contain" />
    </Modal>
  );
}
