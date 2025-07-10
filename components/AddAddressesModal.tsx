'use client';
import AddressInput from './AddressInput';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from '@heroui/react';

type Props = {
  open: boolean;
  onClose: () => void;
  address: string;
  onAddressChange: (v: string) => void;
  addAddressLine: () => void;
  bulk: string;
  onBulkChange: (v: string) => void;
};

export default function AddAddressesModal({
  open,
  onClose,
  address,
  onAddressChange,
  addAddressLine,
  bulk,
  onBulkChange,
}: Props) {
  return (
    <Modal
      isOpen={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      placement="center"
      scrollBehavior="inside"
    >
      <ModalContent className="space-y-4">
        <ModalHeader>Add Addresses</ModalHeader>
        <ModalBody className="space-y-4">
          <div className="flex gap-2">
            <AddressInput
              value={address}
              onChange={onAddressChange}
              placeholder="Add address"
              ariaLabel="Add address"
              id="modal-add-address"
            />
            <Button onPress={addAddressLine} color="primary">
              Add
            </Button>
          </div>
          <textarea
            value={bulk}
            onChange={(e) => onBulkChange(e.target.value)}
            placeholder="One address per line"
            className="border px-3 py-2 rounded w-full h-40 box-border appearance-none dark:bg-gray-800 dark:text-white"
          />
        </ModalBody>
        <ModalFooter>
          <Button fullWidth color="primary" onPress={onClose}>
            Done
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
