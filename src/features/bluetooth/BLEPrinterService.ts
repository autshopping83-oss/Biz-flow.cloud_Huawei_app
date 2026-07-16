// src/features/bluetooth/BLEPrinterService.ts
// Serviço de impressão BLE para impressoras térmicas
// Usa BleClient (positional args) do @capacitor-community/bluetooth-le

import { BleClient, numbersToDataView } from '@capacitor-community/bluetooth-le';

export interface PrinterDevice {
  deviceId: string;
  name: string;
}

export const BLEPrinterService = {
  devices: [] as PrinterDevice[],
  connectedDeviceId: null as string | null,

  /**
   * Escaneia dispositivos BLE próximos
   */
  async scanDevices(timeout = 8000): Promise<PrinterDevice[]> {
    this.devices = [];

    try {
      // Inicializa BLE (pede permissão Bluetooth internamente)
      await BleClient.initialize();
    } catch {
      throw new Error('Permissão Bluetooth não concedida. Ative o Bluetooth nas configurações.');
    }

    // Escanear dispositivos
    await BleClient.requestLEScan(
      { scanMode: 2 }, // SCAN_MODE_LOW_LATENCY
      (result) => {
        if (result.device?.name && result.device?.deviceId) {
          const name = result.device.name;
          const deviceId = result.device.deviceId;
          // Evitar duplicatas
          if (!this.devices.find(d => d.deviceId === deviceId)) {
            this.devices.push({ deviceId, name });
          }
        }
      }
    );

    // Aguardar o tempo de scan
    await new Promise(resolve => setTimeout(resolve, timeout));

    // Parar scan
    await BleClient.stopLEScan();
    return this.devices;
  },

  /**
   * Conecta a um dispositivo BLE
   */
  async connect(deviceId: string): Promise<void> {
    try {
      await BleClient.connect(deviceId, (disconnectedId: string) => {
        console.log('BLE device disconnected:', disconnectedId);
        if (this.connectedDeviceId === disconnectedId) {
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
        await BleClient.disconnect(this.connectedDeviceId);
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

    try {
      // Obter serviços do dispositivo
      const services = await BleClient.getServices(deviceId);

      // Procurar um serviço e característica que suportem escrita
      for (const service of services) {
        for (const char of service.characteristics) {
          if (char.properties?.write || char.properties?.writeWithoutResponse) {
            // Encontrámos uma característica de escrita
            // Dividir em pacotes (limite de MTU ~512 bytes)
            const MTU = 480; // margem de segurança
            for (let i = 0; i < data.length; i += MTU) {
              const chunk = data.slice(i, i + MTU);
              const dataView = numbersToDataView(Array.from(chunk));
              if (char.properties.write) {
                await BleClient.write(deviceId, service.uuid, char.uuid, dataView);
              } else {
                await BleClient.writeWithoutResponse(deviceId, service.uuid, char.uuid, dataView);
              }
            }
            return; // Sucesso
          }
        }
      }

      throw new Error('Nenhuma característica de escrita encontrada na impressora.');
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
