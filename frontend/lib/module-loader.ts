/**
 * Dynamic Module Loader
 * Loads module metadata from the plugin registry and provides runtime module management
 */

export interface ModuleEndpoint {
  method: string;
  path: string;
  description: string;
}

export interface ModuleDefinition {
  id: string;
  name: string;
  version: string;
  category: string;
  industry: string[];
  backend: {
    endpoints: ModuleEndpoint[];
  };
  frontend: {
    component: string;
    props: Record<string, any>;
  };
  capabilities: {
    canGenerateReports: boolean;
    canSendAlerts: boolean;
    requiresDataConnection: boolean;
  };
  dependencies?: string[];
}

export interface ModuleRegistry {
  version: string;
  modules: ModuleDefinition[];
}

export class ModuleLoader {
  private registry: ModuleRegistry | null = null;
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_AI_CORE_URL || 'http://localhost:8000';
  }

  /**
   * Load the module registry from backend
   */
  async loadRegistry(): Promise<ModuleRegistry> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/modules/registry`);
      
      if (!response.ok) {
        throw new Error(`Failed to load module registry: ${response.statusText}`);
      }

      this.registry = await response.json();
      console.log(`Loaded ${this.registry?.modules.length} modules from registry`);
      
      return this.registry;
    } catch (error) {
      console.error('Failed to load module registry:', error);
      throw error;
    }
  }

  /**
   * Get all modules
   */
  getAllModules(): ModuleDefinition[] {
    if (!this.registry) {
      throw new Error('Registry not loaded. Call loadRegistry() first.');
    }
    return this.registry.modules;
  }

  /**
   * Get modules by industry
   */
  getModulesByIndustry(industryId: string): ModuleDefinition[] {
    if (!this.registry) {
      throw new Error('Registry not loaded. Call loadRegistry() first.');
    }

    return this.registry.modules.filter(module =>
      module.industry.includes(industryId)
    );
  }

  /**
   * Get module by ID
   */
  getModuleById(moduleId: string): ModuleDefinition | undefined {
    if (!this.registry) {
      throw new Error('Registry not loaded. Call loadRegistry() first.');
    }

    return this.registry.modules.find(module => module.id === moduleId);
  }

  /**
   * Get modules by category
   */
  getModulesByCategory(category: string): ModuleDefinition[] {
    if (!this.registry) {
      throw new Error('Registry not loaded. Call loadRegistry() first.');
    }

    return this.registry.modules.filter(module => module.category === category);
  }

  /**
   * Check if module has specific capability
   */
  hasCapability(moduleId: string, capability: keyof ModuleDefinition['capabilities']): boolean {
    const module = this.getModuleById(moduleId);
    return module?.capabilities[capability] || false;
  }

  /**
   * Call module backend endpoint
   */
  async callModuleBackend(
    moduleId: string,
    endpointPath: string,
    data: any,
    authToken?: string
  ): Promise<any> {
    const module = this.getModuleById(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }

    const endpoint = module.backend.endpoints.find(e => e.path === endpointPath);
    if (!endpoint) {
      throw new Error(`Endpoint ${endpointPath} not found in module ${moduleId}`);
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint.path}`, {
      method: endpoint.method,
      headers,
      body: endpoint.method !== 'GET' ? JSON.stringify(data) : undefined
    });

    if (!response.ok) {
      throw new Error(`Module API call failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get dependencies for a module
   */
  getModuleDependencies(moduleId: string): ModuleDefinition[] {
    const module = this.getModuleById(moduleId);
    if (!module || !module.dependencies) {
      return [];
    }

    return module.dependencies
      .map(depId => this.getModuleById(depId))
      .filter((m): m is ModuleDefinition => m !== undefined);
  }

  /**
   * Check if all dependencies are satisfied
   */
  areDependenciesSatisfied(moduleId: string, installedModuleIds: string[]): boolean {
    const module = this.getModuleById(moduleId);
    if (!module || !module.dependencies) {
      return true;
    }

    return module.dependencies.every(depId => installedModuleIds.includes(depId));
  }
}

// Export singleton instance
export const moduleLoader = new ModuleLoader();

// Also export class for testing
export default ModuleLoader;

