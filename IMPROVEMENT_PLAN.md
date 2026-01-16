# Plan de Mejoras - Kiosco POS Suite (Flota Vehicular)

Este documento detalla la propuesta de evolución para el sistema de gestión de flota, enfocado en un control más granular de costos, mantenimiento preventivo avanzado y trazabilidad total del activo.

## 1. Módulo Avanzado de Siniestros y Reparaciones (Evolución de "Mapa de Daños")
Actualmente, el sistema permite marcar daños visualmente. La mejora consiste en **gestionar el ciclo de vida** de ese daño.

*   **Funcionalidad:**
    *   Convertir cada "Punto de Daño" en un **Ticket de Incidente**.
    *   Estados del Ticket: `Reportado` ➔ `Presupuestado` ➔ `En Reparación` ➔ `Reparado`.
    *   **Registro de Costos:** Al cerrar el ticket (Reparado), se ingresa el costo de la reparación "Chapa y Pintura" (separado de mecánica).
    *   **Evidencia:** Subir foto del "Antes" y "Después".
*   **Valor:** Permite distinguir gastos de *mantenimiento* (desgaste natural) vs gastos de *siniestros* (mal uso o accidentes).

## 2. Gestión Inteligente de Neumáticos
Los neumáticos son uno de los costos operativos más altos. Se propone un control dedicado.

*   **Funcionalidad:**
    *   **Alertas de Desgaste:** Barra de vida útil visual para cada neumático basada en el KM de colocación y el estimado del fabricante (ej. 50.000 km).
    *   **Registro de Rotación:** Botón para registrar rotación (cruzar delanteras/traseras) que extiende la vida útil sin resetear el contador total.
    *   **Costos:** Registro e imputación de costo específico por "Cambio de Cubiertas".
*   **Valor:** Previsibilidad de gastos altos y seguridad vial garantizada.

## 3. Bitácora (Hoja de Vida) del Vehículo
Unificar toda la información dispersa (combustible, services, daños) en una **Línea de Tiempo** cronológica, agregando eventos manuales.

*   **Funcionalidad:**
    *   **Timeline Unificado:** Ver en una sola lista: "01/01 Service" -> "15/01 Choque" -> "20/01 Carga Nafta".
    *   **Anotaciones Manuales:** Permitir agregar eventos libres que no son ni service ni combustible.
        *   Ejemplos: "Cambio de Batería", "Limpieza de Tapizados", "Multa de Tránsito", "Compra de Accesorios".
    *   **Adjuntos:** Posibilidad de subir PDF/Fotos a estas notas (facturas varias).
*   **Valor:** Aumenta el valor de reventa del vehículo al tener un historial de vida completo y transparente.

## 4. Dashboard de TCO (Costo Total de Propiedad)
Con los módulos anteriores, se puede generar el reporte financiero definitivo.

*   **Funcionalidad:**
    *   Cálculo automático del **Costo por Kilómetro** (La métrica reina en logística).
        *   *(Combustible + Service + Reparaciones + Neumáticos + Varios) / KM Recorridos*
    *   Comparativa: ¿Qué vehículo es más caro de mantener? (Ej. "El Ford Focus gasta un 20% más por KM que la Partner").
*   **Valor:** Toma de decisiones basada en datos duros para renovación de flota.

---

## Sugerencia de Implementación (Paso a Paso)

Recomiendo comenzar en este orden para maximizar el impacto con el menor esfuerzo inicial:

1.  **✅ Fase 1 - Ciclo de Daños (COMPLETADO - 16/01/2026):** Agregar campos `status` y `repairCost` a los daños existentes. (Rápido y de alto impacto visual).
    - ✅ Campos agregados al modelo DamagePoint
    - ✅ Modal de confirmación de reparación con costo y notas
    - ✅ Historial de reparaciones con detalles financieros
    
2.  **✅ Fase 2 - Bitácora/Notas (COMPLETADO - 16/01/2026):** Crear la tabla de eventos genéricos para registrar "todo lo demás".
    - ✅ Modelo `vehicle_note` creado en base de datos
    - ✅ API endpoints para crear y listar notas
    - ✅ Pestaña "Bitácora" con timeline cronológico
    - ✅ Formulario para eventos manuales (multas, limpieza, accesorios, etc.)
    
3.  **✅ Fase 3 - Neumáticos (COMPLETADO - 16/01/2026):** Interfaz visual para gestión de cubiertas.
    - ✅ Modelo `tire` con tracking de desgaste
    - ✅ Diagrama visual del vehículo mostrando posición de neumáticos
    - ✅ Barras de progreso de vida útil con alertas (BUENO/ATENCIÓN/CRÍTICO)
    - ✅ Funcionalidad de rotación automática de ejes
    - ✅ Registro de instalación con kilometraje
    - ✅ Dashboard de estadísticas generales de neumáticos

---

## ESTADO: ✅ PLAN COMPLETO IMPLEMENTADO

Todas las fases del plan de mejoras han sido implementadas exitosamente. El sistema ahora cuenta con:
- **Gestión completa de daños y reparaciones** con tracking financiero
- **Bitácora universal** para cualquier tipo de evento del vehículo
- **Sistema visual de neumáticos** con alertas preventivas y rotación inteligente

**Próximos pasos sugeridos:**
- Dashboard de TCO (Costo Total de Propiedad) - Fase 4 opcional
- Reportes comparativos entre vehículos
- Exportación de datos para análisis
