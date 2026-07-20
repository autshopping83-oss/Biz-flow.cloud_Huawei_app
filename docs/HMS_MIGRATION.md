# Migração para Ecossistema Huawei (HMS Core)

## Resumo das Alterações

Este documento registra as alterações realizadas para adaptar o aplicativo
**Biz-flow.cloud** ao ecossistema Huawei (HMS Core / AppGallery).

## O que foi alterado

### 1. `android/build.gradle` (raiz do projeto Android)

- **Adicionado** repositório Maven da Huawei:
  ```gradle
  maven { url 'https://developer.huawei.com/repo/' }
  ```
- **Substituído** `com.google.gms:google-services:4.4.0` por:
  ```gradle
  classpath 'com.huawei.agconnect:agcp:1.9.1.301'
  ```

### 2. `android/app/build.gradle`

- **Adicionado** plugin AGConnect:
  ```gradle
  apply plugin: 'com.huawei.agconnect'
  ```
- **Removido** bloco condicional de `google-services.json` (não mais aplicado)
- **Adicionada** dependência HMS Push Kit:
  ```gradle
  implementation 'com.huawei.hms:push:6.11.0.300'
  ```

### 3. `android/app/src/main/AndroidManifest.xml`

- **Removida** permissão `com.google.android.gms.permission.AD_ID`

### 4. `android/app/agconnect-services.json`

- **Criado** arquivo de template para configuração da AppGallery Connect.
  > ⚠️ **IMPORTANTE:** Substitua pelos valores reais do seu projeto em
  > [AppGallery Connect](https://developer.huawei.com/consumer/cn/service/josp/agc/index.html).

## Passos para Publicação na Huawei AppGallery

### Pré-requisitos

1. Conta de desenvolvedor Huawei (https://developer.huawei.com)
2. Projeto criado no AppGallery Connect
3. Chave de assinatura (keystore) compatível

### Configuração

1. **Obter `agconnect-services.json` real:**
   - Acesse [AppGallery Connect](https://developer.huawei.com/consumer/cn/service/josp/agc/index.html)
   - Selecione seu projeto → "Configuração do projeto" → "Arquivo de configuração"
   - Faça download do `agconnect-services.json` e substitua o arquivo template em:
     `android/app/agconnect-services.json`

2. **Ajustar assinatura:**
   - O arquivo `bizflow-android.keystore` já está configurado no `signingConfigs`
   - Para AppGallery, recomenda-se gerar um novo keystore específico

3. **Compilar APK/AAB para publicação:**
   ```bash
   cd android
   ./gradlew assembleRelease
   # ou para Android App Bundle:
   ./gradlew bundleRelease
   ```

4. **Fazer upload na AppGallery:**
   - Acesse AppGallery Connect → "Distribuição" → "Lançamento de aplicativo"
   - Faça upload do APK/AAB assinado

### Capacitor Sync

Após alterações no código web (React/TypeScript), sincronize com o Android:

```bash
npm run build && npx cap sync android
```

## Compatibilidade

O aplicativo continua compatível com Google Play Services em dispositivos que
os possuem. Dispositivos Huawei sem GMS utilizarão HMS Core como fallback
transparente, garantindo:

- ✅ Notificações push (via HMS Push Kit)
- ✅ Bluetooth/BLE (API padrão do Android)
- ✅ Funcionalidades offline (Dexie/IndexedDB)
- ✅ Câmera e localização (API padrão do Android)

## Referências

- [Huawei Developers - HMS Core](https://developer.huawei.com/consumer/en/hms/)
- [Guia de Migração HMS](https://developer.huawei.com/consumer/en/doc/development/HMS-Plugin-Guides/migration-guide-0000001050141553)
- [AppGallery Connect](https://developer.huawei.com/consumer/cn/service/josp/agc/index.html)
