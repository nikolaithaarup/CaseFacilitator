import { useCallback, useState } from "react";
import type { ActionLogEntry, CaseScenario } from "../../domain/cases/types";
import { applySimulationCommand, createSimulationState } from "../../domain/simulation/engine";
import type { SimulationCommand, SimulationResult, SimulationState } from "../../domain/simulation/types";

export function useSimulationLifecycle() {
  const [scenario, setScenario] = useState<CaseScenario | null>(null);
  const [simulationState, setSimulationState] = useState<SimulationState | null>(null);
  const [log, setLog] = useState<ActionLogEntry[]>([]);
  const [transitionFeedback, setTransitionFeedback] = useState<string | null>(null);

  const startSimulation = useCallback((nextScenario: CaseScenario) => {
    setScenario(nextScenario);
    setSimulationState(createSimulationState(nextScenario));
    setLog([]);
    setTransitionFeedback(null);
  }, []);

  const resetSimulation = useCallback(() => {
    setScenario(null);
    setSimulationState(null);
    setLog([]);
    setTransitionFeedback(null);
  }, []);

  const applyCommand = useCallback((
    command: SimulationCommand,
    options: { recordLog?: boolean } = {},
  ): SimulationResult | null => {
    if (!scenario || !simulationState) return null;
    const transition = scenario.transitions.find(
      (item) => item.fromStateId === simulationState.patient.id && item.actionId === command.actionId,
    );
    const result = applySimulationCommand(scenario, simulationState, command);
    setSimulationState(result.state);
    if (options.recordLog !== false) {
      setLog((previous) => [...previous, {
        id: command.commandId,
        timeMs: command.occurredAtMs,
        actionId: command.actionId,
        description: command.description,
        resultingStateId: result.state.patient.id,
        ...(command.metadata ? { meta: command.metadata } : {}),
      }]);
    }
    if (transition?.feedbackToFacilitator) setTransitionFeedback(transition.feedbackToFacilitator);
    return result;
  }, [scenario, simulationState]);

  return {
    scenario,
    simulationState,
    currentState: simulationState?.patient ?? null,
    log,
    transitionFeedback,
    startSimulation,
    resetSimulation,
    applyCommand,
    // Compatibility setters are temporary while remaining screen orchestration is migrated.
    setScenario,
    setSimulationState,
    setLog,
  };
}
