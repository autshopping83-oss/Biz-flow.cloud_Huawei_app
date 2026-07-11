// src/features/bluetooth/BLEPrinterService.ts
// Serviço de impressão BLE para impressoras térmicas

import { BluetoothLe, type Device, type BleClient } from '@capacitor-community/bluetooth-le';

export interface PrinterDevice {
  deviceId: string;
  name: string;
}

// UUIDs comuns para impressoras térmicas BLE
const PRINTER_SERVICE_UUID = '000018f0-0000-1000-8000-00805f9b34fb';
const PRINTER_CHARACTERISTIC_UUID = '00002af1-0000-1000-8000-00805f9b34fb';

// UUIDs alternativos (algumas impressoras usam SPP over BLE)
const SPP_SERVICE_UUID = '0000abf0-0000-1000-8000-00805f9b34fb';
const SPP_CHARACTERISTIC_UUID = '0000abf1-0000-1000-8000-00805f9b34fb';

export const BLEPrinterService = {
  private devices: PrinterDevice[] = [],
  private connectedDeviceId: string | null = null,

  /**
   * Escaneia dispositivos BLE próximos
   */
  async scanDevices(timeout = 5000): Promise<PrinterDevice[]> {
    this.devices = [];

    // Pedir permissão para escanear
    try {
      await BluetoothLe.requestPermissions();
    } catch {
      throw new Error('Permissão Bluetooth não concedida.');
    }

    await BluetoothLe.initialize();

    // Iniciar scan
    await BluetoothLe.startScanning(
      (device: Device) => {
        if (device.name && device.deviceId) {
          // Filtra apenas dispositivos com nome sugestivo de impressora
          const name = device.name.toLowerCase();
          if (
            name.includes('printer') ||
            name.includes('thermal') ||
            name.includes('impress') ||
            name.includes('58mm') ||
            name.includes('80mm') ||
            name.includes('pos') ||
            name.includes('ble')
          ) {
            this.devices.push({
              deviceId: device.deviceId,
              name: device.name,
            });
          } else {
            // Adiciona todos para debug
            this.devices.push({
              deviceId: device.deviceId,
              name: device.name,
            });
          }
        }
      },
      { timeout }
    );

    await BluetoothLe.stopScanning();
    return this.devices;
  },

  /**
   * Conecta a um dispositivo BLE
   */
  async connect(deviceId: string): Promise<void> {
    try {
      await BluetoothLe.connect(deviceId, (deviceId) => {
        console.log('BLE device disconnected:', deviceId);
        if (this.connectedDeviceId === deviceId) {
          this.connectedDeviceId = null;
        }
      });
      this.connectedDeviceId = deviceId;
    } catch (error) {
      throw new Error(`Falha ao conectar: ${(error as Error).message}`);
    }
  },

  /**
   * Desconecta do dispositivo atual
   */
  async disconnect(): Promise<void> {
    if (this.connectedDeviceId) {
      try {
        await BluetoothLe.disconnect(this.connectedDeviceId);
      } catch {
        // Silencioso
      }
      this.connectedDeviceId = null;
    }
  },

  /**
   * Envia dados para a impressora
   */
  async print(data: Uint8Array): Promise<void> {
    if (!this.connectedDeviceId) {
      throw new Error('Nenhuma impressora conectada.');
    }

    const deviceId = this.connectedDeviceId;

    // Tentar serviço de impressora padrão
    try {
      const services = await BluetoothLe.getServices(deviceId);
      const printerService = services.find(
        s => s.uuid.toLowerCase() === PRINTER_SERVICE_UUID ||
             s.uuid.toLowerCase() === SPP_SERVICE_UUID
      );

      if (printerService) {
        const characteristics = await BluetoothLe.getCharacteristics(
          deviceId,
          printerService.uuid
        );

        const printChar = characteristics.find(
          c => c.uuid.toLowerCase() === PRINTER_CHARACTERISTIC_UUID ||
               c.uuid.toLowerCase() === SPP_CHARACTERISTIC_UUID ||
               c.properties?.write
        );

        if (printChar) {
          // Dividir em pacotes de 512 bytes (limite BLE)
          const MTU = 512;
          for (let i = 0; i < data.length; i += MTU) {
            const chunk = data.slice(i, i + MTU);
            await BluetoothLe.write(deviceId, printerService.uuid, printChar.uuid, Array.from(chunk));
          }
          return;
        }
      }

      // Fallback: escrever no primeiro serviço/characteristic que suporta write
      for (const service of services) {
        const characteristics = await BluetoothLe.getCharacteristics(deviceId, service.uuid);
        const writeChar = characteristics.find(c => c.properties?.write || c.properties?.writeWithoutResponse);
        if (writeChar) {
          const MTU = 512;
          for (let i = 0; i < data.length; i += MTU) {
            const chunk = data.slice(i, i + MTU);
            await BluetoothLe.write(deviceId, service.uuid, writeChar.uuid, Array.from(chunk));
          }
          return;
        }
      }

      throw new Error('Nenhuma característica de escrita encontrada.');
    } catch (error) {
      throw new Error(`Erro de impressão: ${(error as Error).message}`);
    }
  },

  /**
   * Verifica se está conectado
   */
  isConnected(): boolean {
    return this.connectedDeviceId !== null;
  },

  /**
   * Retorna o ID do dispositivo conectado
   */
  getConnectedDeviceId(): string | null {
    return this.connectedDeviceId;
  },
};
