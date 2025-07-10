'use client';
import { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from '@heroui/react';

interface Props {
  url: string;
  onShare?: () => void;
}

export default function ShareModal({ url, onShare }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        onPress={() => {
          onShare?.();
          setOpen(true);
        }}
        color="primary"
      >
        Share
      </Button>
      <Modal isOpen={open} onOpenChange={setOpen} placement="center">
        <ModalContent>
          <ModalHeader>Share</ModalHeader>
          <ModalBody>
            <p className="mb-2">Share this link:</p>
            <input
              value={url}
              readOnly
              className="w-full border px-3 py-2 rounded dark:bg-gray-700 dark:text-white"
            />
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={() => setOpen(false)}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
