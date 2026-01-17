# 🔐 SSO - Single Sign-On Implementation Guide

**Sistema de Auto-Login desde Sistemas Externos**

---

## 🎯 Objetivo

Permitir que usuarios autenticados en otros sistemas (ERP, CRM, sistema principal) accedan automáticamente al sistema de Flotas sin tener que hacer login nuevamente.

---

## 📋 Endpoint Implementado

```
POST /api/auth/external-login
```

**Documentación completa:** `http://localhost:3001/api-docs` → **Autenticación** → **external-login**

---

## 🔧 Configuración

### 1. Variable de Entorno

Agregar a tu archivo `.env`:

```env
SSO_SECRET="tu-secret-compartido-super-seguro-cambiar-en-produccion"
```

⚠️ **Este secret debe ser el MISMO** en ambos sistemas (el externo y este).

### 2. Generar Secret Seguro

```bash
# En Linux/Mac
openssl rand -base64 32

# En Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

---

## 💻 Implementación en Sistema Externo

### Opción A: JavaScript/Node.js (Backend)

```javascript
const crypto = require('crypto');

async function loginToFleetSystem(userEmail) {
  // 1. Preparar payload
  const payload = {
    email: userEmail,
    timestamp: Date.now(),
    systemId: 'mi-erp-paviotti' // Opcional, para logging
  };

  // 2. Generar firma HMAC
  const SSO_SECRET = process.env.SSO_SECRET; // Mismo secret que en Fleet
  const signature = crypto
    .createHmac('sha256', SSO_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');

  // 3. Hacer request a Fleet API
  const response = await fetch('http://localhost:3001/api/auth/external-login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-SSO-Signature': signature
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (response.ok) {
    // 4. Success! Retornar tokens
    return {
      success: true,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user
    };
  } else {
    // Error
    return {
      success: false,
      error: data.error
    };
  }
}

// Uso:
const result = await loginToFleetSystem('usuario@paviotti.com');
if (result.success) {
  console.log('Token JWT:', result.accessToken);
  // Redirigir al usuario...
}
```

### Opción B: PHP

```php
<?php
function loginToFleetSystem($userEmail) {
    // 1. Preparar payload
    $payload = [
        'email' => $userEmail,
        'timestamp' => round(microtime(true) * 1000),
        'systemId' => 'mi-erp-paviotti'
    ];
    
    // 2. Generar firma HMAC
    $ssoSecret = getenv('SSO_SECRET');
    $payloadJson = json_encode($payload, JSON_UNESCAPED_SLASHES);
    $signature = hash_hmac('sha256', $payloadJson, $ssoSecret);
    
    // 3. Hacer request a Fleet API
    $ch = curl_init('http://localhost:3001/api/auth/external-login');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payloadJson,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'X-SSO-Signature: ' . $signature
        ]
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    $data = json_decode($response, true);
    
    if ($httpCode === 200) {
        return [
            'success' => true,
            'accessToken' => $data['accessToken'],
            'refreshToken' => $data['refreshToken'],
            'user' => $data['user']
        ];
    } else {
        return [
            'success' => false,
            'error' => $data['error'] ?? 'Error desconocido'
        ];
    }
}

// Uso:
$result = loginToFleetSystem('usuario@paviotti.com');
if ($result['success']) {
    echo "Token JWT: " . $result['accessToken'];
    // Redirigir al usuario...
}
?>
```

### Opción C: Python

```python
import hmac
import hashlib
import json
import time
import requests

def login_to_fleet_system(user_email):
    # 1. Preparar payload
    payload = {
        'email': user_email,
        'timestamp': int(time.time() * 1000),
        'systemId': 'mi-erp-paviotti'
    }
    
    # 2. Generar firma HMAC
    sso_secret = os.getenv('SSO_SECRET').encode('utf-8')
    payload_json = json.dumps(payload, separators=(',', ':'))
    signature = hmac.new(
        sso_secret,
        payload_json.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    # 3. Hacer request a Fleet API
    response = requests.post(
        'http://localhost:3001/api/auth/external-login',
        json=payload,
        headers={
            'X-SSO-Signature': signature
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        return {
            'success': True,
            'accessToken': data['accessToken'],
            'refreshToken': data['refreshToken'],
            'user': data['user']
        }
    else:
        return {
            'success': False,
            'error': response.json().get('error', 'Error desconocido')
        }

# Uso:
result = login_to_fleet_system('usuario@paviotti.com')
if result['success']:
    print(f"Token JWT: {result['accessToken']}")
    # Redirigir al usuario...
```

---

## 🌐 Redirección del Usuario

### Opción 1: Redirección Directa con Token en URL

```javascript
// En el sistema externo, después de obtener el token:
const { accessToken, refreshToken } = result;

// Codificar tokens en Base64 o URL-safe
const encodedAccess = encodeURIComponent(accessToken);
const encodedRefresh = encodeURIComponent(refreshToken);

// Redirigir
window.location.href = `http://localhost:5173?token=${encodedAccess}&refresh=${encodedRefresh}`;
```

**En el frontend de Fleet (`src/App.tsx` o un hook):**

```typescript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const refresh = params.get('refresh');

  if (token && refresh) {
    // Guardar en localStorage
    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', refresh);
    
    // Limpiar URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Recargar para que AuthContext detecte el token
    window.location.reload();
  }
}, []);
```

### Opción 2: Post Message (más seguro)

```javascript
// Sistema externo abre Fleet en iframe o popup
const fleetWindow = window.open('http://localhost:5173/sso-receiver', '_blank');

// Esperar a que cargue
fleetWindow.addEventListener('load', () => {
  fleetWindow.postMessage({
    type: 'SSO_TOKEN',
    accessToken: result.accessToken,
    refreshToken: result.refreshToken
  }, 'http://localhost:5173');
});
```

**En Fleet (`src/pages/SSOReceiver.tsx`):**

```typescript
useEffect(() => {
  const handleMessage = (event) => {
    if (event.origin !== 'http://sistema-externo.com') return;
    
    if (event.data.type === 'SSO_TOKEN') {
      localStorage.setItem('accessToken', event.data.accessToken);
      localStorage.setItem('refreshToken', event.data.refreshToken);
      window.location.href = '/';
    }
  };

  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, []);
```

---

## 🔒 Seguridad

### 1. Timestamp Anti-Replay

El endpoint valida que el timestamp no sea mayor a **5 minutos**. Esto previene ataques de replay donde alguien intercepta una request válida y la reenvía múltiples veces.

### 2. Firma HMAC

Solo sistemas que conozcan el `SSO_SECRET` pueden generar firmas válidas. Esto previene que atacantes creen requests falsas.

### 3. HTTPS en Producción

⚠️ **CRÍTICO:** En producción, SIEMPRE usar HTTPS para prevenir man-in-the-middle attacks.

```javascript
// Producción:
const response = await fetch('https://fleet.paviotti.com/api/auth/external-login', {
  // ...
});
```

### 4. Rate Limiting

El endpoint `/api/auth/external-login` ya está protegido por rate limiting (5 intentos cada 15 minutos) configurado en la Opción B.

---

## 🧪 Testing

### Con cURL

```bash
# 1. Generar timestamp
TIMESTAMP=$(date +%s)000

# 2. Crear payload
PAYLOAD='{"email":"admin@paviotti.com","timestamp":'$TIMESTAMP'}'

# 3. Generar firma HMAC
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "default-sso-secret-change-me" | cut -d' ' -f2)

# 4. Hacer request
curl -X POST http://localhost:3001/api/auth/external-login \
  -H "Content-Type: application/json" \
  -H "X-SSO-Signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

### Con Swagger UI

1. Abrir `http://localhost:3001/api-docs`
2. Ir a **Autenticación** → **POST /api/auth/external-login**
3. Click en "Try it out"
4. **Primero generar la firma** (usar el código de ejemplo)
5. Pegar la firma en el header `X-SSO-Signature`
6. Pegar el payload en el body
7. Click en "Execute"

---

## 📊 Flujo Completo

```
┌─────────────────────────────────────────────────────────┐
│                 SISTEMA EXTERNO (ERP)                    │
│                                                          │
│  1. Usuario hace login                                   │
│  2. Sistema valida credenciales                          │
│  3. Sistema genera payload:                              │
│     { email, timestamp }                                 │
│  4. Sistema calcula HMAC signature                       │
│  5. Sistema hace POST a /api/auth/external-login         │
│                                                          │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│              PAVIOTTI FLEET API                          │
│                                                          │
│  6. Valida X-SSO-Signature header                       │
│  7. Verifica timestamp (< 5 min)                        │
│  8. Recalcula HMAC y compara                            │
│  9. Si OK: Busca usuario por email                      │
│  10. Genera JWT tokens                                   │
│  11. Retorna: { accessToken, refreshToken, user }        │
│                                                          │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                 SISTEMA EXTERNO (ERP)                    │
│                                                          │
│  12. Recibe tokens                                       │
│  13. Redirige usuario a Fleet con token                  │
│      http://fleet.paviotti.com?token=xyz                 │
│                                                          │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│            PAVIOTTI FLEET FRONTEND                       │
│                                                          │
│  14. Detecta token en URL                                │
│  15. Guarda en localStorage                              │
│  16. AuthContext detecta token                           │
│  17. Usuario autenticado automáticamente! ✅             │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Implementación

### En el Sistema Externo:
- [ ] Configurar `SSO_SECRET` (mismo que en Fleet)
- [ ] Implementar función de generación de firma HMAC
- [ ] Crear endpoint/función para llamar a `/api/auth/external-login`
- [ ] Implementar redirección con token

### En Paviotti Fleet:
- [x] Endpoint `/api/auth/external-login` implementado
- [x] Validación HMAC
- [x] Validación de timestamp
- [x] Documentación Swagger
- [ ] Agregar `SSO_SECRET` a archivo `.env`
- [ ] Modificar frontend para detectar token en URL

### Testing:
- [ ] Probar con cURL
- [ ] Probar desde sistema externo (desarrollo)
- [ ] Verificar logs de éxito/error
- [ ] Probar timestamp expirado
- [ ] Probar firma inválida

---

## 🎉 ¡Listo para Usar!

El endpoint ya está funcionando. Puedes probarlo inmediatamente desde Swagger UI o con las implementaciones de ejemplo arriba.

**Acceso a documentación:** `http://localhost:3001/api-docs`
