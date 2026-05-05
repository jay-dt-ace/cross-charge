import { type WorkflowCreate } from "@dynatrace-sdk/client-automation";

export const appId = `dynatrace.cross.charge`;

export const actionGetEntities = appId + ":get-entities";
export const actionGetEntityInfo = appId + ":get-entity-information";
export const actionSendBizEvent = appId + ":send-bizevent";
export const actionGetBillingUsage = appId + ":get-billing-usage";
export const bizEventRef = "{{ _.bizevents }}";
export const idEntityID = "{{ _.entity_id }}";
export const tagKeys = '{{ result("get_rate_card").tag_keys }}';
export const entityInfo = "{{ _.entity }}";
export const rateCard = '{{ result("get_rate_card") }}';
export const sendBizEventDesc =
  "Sends bizevent to configured Dynatrace tenant. Requires Configuration.";
export const billingUsageDesc =
  "Gathers DPS billing usage for specific entity and creates bizevent.";

export const workflow: WorkflowCreate = {
  title: "Cross Charge Workflow",
  tasks: {
    get_fs_hosts: {
      name: "get_fs_hosts",
      action: actionGetEntities,
      description: "Gathers all the entity IDs of Fullstack Hosts",
      input: {
        entityType: "full_stack",
        billingMetrics:
          "builtin:billing.full_stack_monitoring.usage_per_host,builtin:billing.runtime_vulnerability_analytics.usage_per_host",
      },
      active: true,
      position: {
        x: -2,
        y: 3,
      },
      predecessors: ["get_metric_bucket_usage"],
      conditions: {
        states: {
          get_metric_bucket_usage: "OK",
        },
      },
    },
    get_rum_apps: {
      name: "get_rum_apps",
      action: actionGetEntities,
      description: "Gathers all the entity IDs of RUM Applications",
      input: {
        otherType: "application",
        entityType: "other",
        billingMetrics:
          "builtin:billing.real_user_monitoring.web.session.usage_by_app,builtin:billing.real_user_monitoring.web.session_with_replay.usage_by_app,builtin:billing.real_user_monitoring.web.property.usage_by_application",
      },
      position: {
        x: -1,
        y: 3,
      },
      predecessors: ["get_metric_bucket_usage"],
      conditions: {
        states: {
          get_metric_bucket_usage: "OK",
        },
      },
    },
    get_f_d_hosts: {
      name: "get_f_d_hosts",
      action: actionGetEntities,
      description: "Gathers all the entity IDs of Foundation & Discovery Hosts",
      input: {
        entityType: "foundation",
        billingMetrics:
          "builtin:billing.foundation_and_discovery.usage_per_host,builtin:billing.runtime_vulnerability_analytics.usage_per_host",
      },
      position: {
        x: -4,
        y: 3,
      },
      predecessors: ["get_metric_bucket_usage"],
      conditions: {
        states: {
          get_metric_bucket_usage: "OK",
        },
      },
    },
    get_rate_card: {
      name: "get_rate_card",
      action: appId + ":get-rate-card",
      description:
        "Gathers rate card data via Dynatrace accounts API. Requires Configuration.",
      input: {
        connectionId: "",
      },
      position: {
        x: 0,
        y: 1,
      },
      predecessors: [],
    },
    get_serverless: {
      name: "get_serverless",
      action: actionGetEntities,
      description: "Gathers all the entity IDs of Serverless Function Services",
      input: {
        otherType: "",
        entityType: "serverless",
        billingMetrics:
          "builtin:billing.serverless_functions_classic.usage_by_entity",
      },
      position: {
        x: 5,
        y: 3,
      },
      predecessors: ["get_metric_bucket_usage"],
      conditions: {
        states: {
          get_metric_bucket_usage: "OK",
        },
      },
    },
    get_infra_hosts: {
      name: "get_infra_hosts",
      action: actionGetEntities,
      description: "Gathers all the entity IDs of Infra Only Hosts",
      input: {
        entityType: "infra",
        billingMetrics:
          "builtin:billing.infrastructure_monitoring.usage_per_host,builtin:billing.runtime_vulnerability_analytics.usage_per_host",
      },
      active: true,
      position: {
        x: -3,
        y: 3,
      },
      predecessors: ["get_metric_bucket_usage"],
      conditions: {
        states: {
          get_metric_bucket_usage: "OK",
        },
      },
    },
    get_f_d_host_info: {
      name: "get_f_d_host_info",
      action: actionGetEntityInfo,
      description: "Gathers entity name and tags for FS Host IDs.",
      input: {
        entity: idEntityID,
        tagKeys: tagKeys,
      },
      position: {
        x: -4,
        y: 4,
      },
      predecessors: ["get_f_d_hosts"],
      conditions: {
        states: {
          get_f_d_hosts: "OK",
        },
      },
      withItems: 'entity_id in {{ result("get_f_d_hosts").entity_ids }}',
      concurrency: 75,
      retry: {
        count: 2,
        delay: 10,
        failedLoopIterationsOnly: true,
      },
      timeout: 1800,
    },
    get_syn_3rd_party: {
      name: "get_syn_3rd_party",
      action: actionGetEntities,
      description: "Gathers all the entity IDs of Synthetic 3rd Party Tests",
      input: {
        otherType: "external_synthetic_test",
        entityType: "other",
        billingMetrics:
          "builtin:billing.synthetic.external.usage_by_third_party_monitor",
      },
      position: {
        x: 3,
        y: 3,
      },
      predecessors: ["get_metric_bucket_usage"],
      conditions: {
        states: {
          get_metric_bucket_usage: "OK",
        },
      },
    },
    get_k8s_namespaces: {
      name: "get_k8s_namespaces",
      action: actionGetEntities,
      description: "Gathers all the entity IDs of Kubernetes Namespaces",
      input: {
        otherType: "cloud_application_namespace",
        entityType: "other",
        billingMetrics: "builtin:billing.kubernetes_monitoring.usage",
      },
      position: {
        x: 4,
        y: 3,
      },
      predecessors: ["get_metric_bucket_usage"],
      conditions: {
        states: {
          get_metric_bucket_usage: "OK",
        },
      },
    },
    get_mainframe_hosts: {
      name: "get_mainframe_hosts",
      action: actionGetEntities,
      description: "Gathers all the entity IDs of Mainframe Hosts",
      input: {
        entityType: "mainframe",
        billingMetrics: "builtin:billing.mainframe_monitoring.usage",
      },
      position: {
        x: -5,
        y: 3,
      },
      predecessors: ["get_metric_bucket_usage"],
      conditions: {
        states: {
          get_metric_bucket_usage: "OK",
        },
      },
    },
    get_serverless_info: {
      name: "get_serverless_info",
      action: actionGetEntityInfo,
      description: "Gathers entity name and tags for Serverless entity ID.",
      input: {
        entity: idEntityID,
        tagKeys: tagKeys,
      },
      position: {
        x: 5,
        y: 4,
      },
      predecessors: ["get_serverless"],
      conditions: {
        states: {
          get_serverless: "OK",
        },
      },
      withItems: 'entity_id in {{ result("get_serverless").entity_ids }}',
      concurrency: 75,
      retry: {
        count: 2,
        delay: 15,
        failedLoopIterationsOnly: true,
      },
      timeout: 1800,
    },
    get_syn_http_checks: {
      name: "get_syn_http_checks",
      action: actionGetEntities,
      description: "Gathers all the entity IDs of Synthetic HTTP Checks",
      input: {
        otherType: "http_check",
        entityType: "other",
        billingMetrics:
          "builtin:billing.synthetic.requests.usage_by_http_monitor",
      },
      position: {
        x: 2,
        y: 3,
      },
      predecessors: ["get_metric_bucket_usage"],
      conditions: {
        states: {
          get_metric_bucket_usage: "OK",
        },
      },
    },
    get_syn_browser_info: {
      name: "get_syn_browser_info",
      action: actionGetEntityInfo,
      description:
        "Gathers entity name and tags for Synthetic Browser entity ID.",
      input: {
        entity: idEntityID,
        tagKeys: tagKeys,
      },
      position: {
        x: 1,
        y: 4,
      },
      predecessors: ["get_syn_browser_monitors"],
      conditions: {
        states: {
          get_syn_browser_monitors: "OK",
        },
      },
      withItems:
        'entity_id in {{ result("get_syn_browser_monitors").entity_ids }}',
      concurrency: 75,
      retry: {
        count: 2,
        delay: 20,
        failedLoopIterationsOnly: true,
      },
      timeout: 1800,
    },
    get_k8s_namespace_info: {
      name: "get_k8s_namespace_info",
      action: actionGetEntityInfo,
      description: "Gathers entity name and tags for K8s Namespace entity IDs.",
      input: {
        entity: idEntityID,
        tagKeys: tagKeys,
      },
      position: {
        x: 4,
        y: 4,
      },
      predecessors: ["get_k8s_namespaces"],
      conditions: {
        states: {
          get_k8s_namespaces: "OK",
        },
      },
      withItems: 'entity_id in {{ result("get_k8s_namespaces").entity_ids }}',
      concurrency: 75,
      retry: {
        count: 2,
        delay: 25,
        failedLoopIterationsOnly: true,
      },
      timeout: 1800,
    },
    get_syn_3rd_party_info: {
      name: "get_syn_3rd_party_info",
      action: actionGetEntityInfo,
      description:
        "Gathers entity name and tags for 3rd Party Synthetic Tests entity IDs.",
      input: {
        entity: idEntityID,
        tagKeys: tagKeys,
      },
      position: {
        x: 3,
        y: 4,
      },
      predecessors: ["get_syn_3rd_party"],
      conditions: {
        states: {
          get_syn_3rd_party: "OK",
        },
      },
      withItems: 'entity_id in {{ result("get_syn_3rd_party").entity_ids }}',
      concurrency: 75,
      retry: {
        count: 2,
        delay: 30,
        failedLoopIterationsOnly: true,
      },
      timeout: 1800,
    },
    send_fs_host_bizevents: {
      name: "send_fs_host_bizevents",
      action: actionSendBizEvent,
      description: sendBizEventDesc,
      input: {
        bizeventRef: bizEventRef,
        connectionId: "",
        localIngest: true,
      },
      active: true,
      position: {
        x: -2,
        y: 6,
      },
      predecessors: ["get_fs_host_billing_usage"],
      conditions: {
        states: {
          get_fs_host_billing_usage: "OK",
        },
      },
      withItems: 'bizevents in {{result("get_fs_host_billing_usage")}}',
      concurrency: 10,
      timeout: 1800,
    },
    get_fs_host_information: {
      name: "get_fs_host_information",
      action: actionGetEntityInfo,
      description: "Gathers entity name and tags for specified entity ID",
      input: {
        entity: idEntityID,
        tagKeys: tagKeys,
      },
      active: true,
      position: {
        x: -2,
        y: 4,
      },
      customSampleResult: {
        entity_info:
          "{'tags': {'Organization': 'local'}, 'entity_id': 'HOST-F0F9A99C8C38D2A4', 'entity_name': 'laptop'} ",
        entity_type: "host",
        billing_metrics: [
          "builtin:billing.full_stack_monitoring.usage_per_host",
          "builtin:billing.runtime_vulnerability_analytics.usage_per_host",
        ],
      },
      predecessors: ["get_fs_hosts"],
      conditions: {
        states: {
          get_fs_hosts: "OK",
        },
      },
      withItems: 'entity_id in {{result("get_fs_hosts").entity_ids}} ',
      concurrency: 75,
      retry: {
        count: 2,
        delay: 10,
        failedLoopIterationsOnly: true,
      },
      timeout: 1800,
    },
    get_mainframe_host_info: {
      name: "get_mainframe_host_info",
      action: actionGetEntityInfo,
      description:
        "Gathers entity name and tags for Mainframe Host entity IDs.",
      input: {
        entity: idEntityID,
        tagKeys: tagKeys,
      },
      position: {
        x: -5,
        y: 4,
      },
      predecessors: ["get_mainframe_hosts"],
      conditions: {
        states: {
          get_mainframe_hosts: "OK",
        },
      },
      withItems: 'entity_id in {{ result("get_mainframe_hosts").entity_ids }}',
      concurrency: 75,
      retry: {
        count: 2,
        delay: 15,
        failedLoopIterationsOnly: true,
      },
      timeout: 1800,
    },
    get_metric_bucket_usage: {
      name: "get_metric_bucket_usage",
      action: appId + ":get-metric-bucket-usage",
      description: "Gathers % of included host metrics that were billed.",
      active: true,
      position: {
        x: 0,
        y: 2,
      },
      predecessors: ["get_rate_card"],
      conditions: {
        states: {
          get_rate_card: "OK",
        },
      },
    },
    get_rum_app_information: {
      name: "get_rum_app_information",
      action: actionGetEntityInfo,
      description:
        "Gathers entity name and tags for RUM Application entity IDs.",
      input: {
        entity: idEntityID,
        tagKeys: tagKeys,
      },
      position: {
        x: -1,
        y: 4,
      },
      predecessors: ["get_rum_apps"],
      conditions: {
        states: {
          get_rum_apps: "OK",
        },
      },
      withItems: 'entity_id in {{ result("get_rum_apps").entity_ids }}',
      concurrency: 75,
      retry: {
        count: 2,
        delay: 20,
        failedLoopIterationsOnly: true,
      },
      timeout: 1800,
    },
    get_syn_http_check_info: {
      name: "get_syn_http_check_info",
      action: actionGetEntityInfo,
      description:
        "Gathers entity name and tags for Synthetic HTTP Check entity IDs.",
      input: {
        entity: idEntityID,
        tagKeys: tagKeys,
      },
      position: {
        x: 2,
        y: 4,
      },
      predecessors: ["get_syn_http_checks"],
      conditions: {
        states: {
          get_syn_http_checks: "OK",
        },
      },
      withItems: 'entity_id in {{ result("get_syn_http_checks").entity_ids }}',
      concurrency: 75,
      retry: {
        count: 2,
        delay: 25,
        failedLoopIterationsOnly: true,
      },
      timeout: 1800,
    },
    send_f_d_host_bizevents: {
      name: "send_f_d_host_bizevents",
      action: actionSendBizEvent,
      description: sendBizEventDesc,
      input: {
        bizeventRef: bizEventRef,
        connectionId: "",
        localIngest: true,
      },
      position: {
        x: -4,
        y: 6,
      },
      predecessors: ["get_f_d_host_billing_usage"],
      conditions: {
        states: {
          get_f_d_host_billing_usage: "OK",
        },
      },
      withItems: 'bizevents in {{ result("get_f_d_host_billing_usage") }}',
      concurrency: 10,
      timeout: 1800,
    },
    send_rum_apps_bizevents: {
      name: "send_rum_apps_bizevents",
      action: actionSendBizEvent,
      description: sendBizEventDesc,
      input: {
        bizeventRef: bizEventRef,
        connectionId: "",
        localIngest: true,
      },
      position: {
        x: -1,
        y: 6,
      },
      predecessors: ["get_rum_app_billing_usage"],
      conditions: {
        states: {
          get_rum_app_billing_usage: "OK",
        },
      },
      withItems: 'bizevents in {{ result("get_rum_app_billing_usage") }}',
      concurrency: 10,
      timeout: 1800,
    },
    get_syn_browser_monitors: {
      name: "get_syn_browser_monitors",
      action: actionGetEntities,
      description: "Gathers all the entity IDs of Synthetic Browser Monitors",
      input: {
        otherType: "synthetic_test",
        entityType: "other",
        billingMetrics:
          "builtin:billing.synthetic.actions.usage_by_browser_monitor",
      },
      position: {
        x: 1,
        y: 3,
      },
      predecessors: ["get_metric_bucket_usage"],
      conditions: {
        states: {
          get_metric_bucket_usage: "OK",
        },
      },
    },
    get_fs_host_billing_usage: {
      name: "get_fs_host_billing_usage",
      action: actionGetBillingUsage,
      description:
        "Gathers DPS billing usage for specific entity and creates bizevent",
      input: {
        rateCard: '{{result("get_rate_card")}}',
        entityInfo: entityInfo,
        entityType: '{{result("get_fs_hosts").entity_type}}',
        metricBucket: '{{ result("get_metric_bucket_usage").FS_percent }}',
        billingMetrics: '{{result("get_fs_hosts").billing_metrics}}',
      },
      active: true,
      position: {
        x: -2,
        y: 5,
      },
      predecessors: ["get_fs_host_information"],
      conditions: {
        states: {
          get_fs_host_information: "OK",
        },
        custom: "",
      },
      withItems: 'entity in {{result("get_fs_host_information")}}',
      concurrency: 10,
      retry: {
        count: 2,
        delay: 25,
        failedLoopIterationsOnly: true,
      },
      timeout: 1800,
    },
    get_rum_app_billing_usage: {
      name: "get_rum_app_billing_usage",
      action: actionGetBillingUsage,
      description: billingUsageDesc,
      input: {
        rateCard: rateCard,
        entityInfo: entityInfo,
        entityType: '{{ result("get_rum_apps").entity_type }}',
        billingMetrics: '{{ result("get_rum_apps").billing_metrics }}',
      },
      position: {
        x: -1,
        y: 5,
      },
      predecessors: ["get_rum_app_information"],
      conditions: {
        states: {
          get_rum_app_information: "OK",
        },
      },
      withItems: 'entity in {{ result("get_rum_app_information") }}',
      concurrency: 10,
      retry: {
        count: 2,
        delay: 30,
        failedLoopIterationsOnly: true,
      },
      timeout: 1800,
    },
    send_infra_host_bizevents: {
      name: "send_infra_host_bizevents",
      action: actionSendBizEvent,
      description: sendBizEventDesc,
      input: {
        bizeventRef: bizEventRef,
        connectionId: "",
        localIngest: true,
      },
      active: true,
      position: {
        x: -3,
        y: 6,
      },
      predecessors: ["get_infra_host_billing_usage"],
      conditions: {
        states: {
          get_infra_host_billing_usage: "OK",
        },
      },
      withItems: 'bizevents in {{ result("get_infra_host_billing_usage") }}',
      concurrency: 10,
      timeout: 1800,
    },
    send_serverless_bizevents: {
      name: "send_serverless_bizevents",
      action: actionSendBizEvent,
      description: sendBizEventDesc,
      input: {
        bizeventRef: bizEventRef,
        connectionId: "",
        localIngest: true,
      },
      position: {
        x: 5,
        y: 6,
      },
      predecessors: ["get_serverless_billing_usage"],
      conditions: {
        states: {
          get_serverless_billing_usage: "OK",
        },
      },
      withItems: 'bizevents in {{ result("get_serverless_billing_usage") }}',
      concurrency: 10,
      timeout: 1800,
    },
    get_f_d_host_billing_usage: {
      name: "get_f_d_host_billing_usage",
      action: actionGetBillingUsage,
      description: billingUsageDesc,
      input: {
        rateCard: rateCard,
        entityInfo: entityInfo,
        entityType: '{{ result("get_f_d_hosts").entity_type }}',
        metricBucket: '{{ result("get_metric_bucket_usage").FD_percent }}',
        billingMetrics: '{{ result("get_f_d_hosts").billing_metrics }}',
      },
      position: {
        x: -4,
        y: 5,
      },
      predecessors: ["get_f_d_host_info"],
      conditions: {
        states: {
          get_f_d_host_info: "OK",
        },
      },
      withItems: 'entity in {{ result("get_f_d_host_info") }}',
      concurrency: 10,
      retry: {
        count: 2,
        delay: 15,
        failedLoopIterationsOnly: true,
      },
      timeout: 1800,
    },
    get_infra_host_information: {
      name: "get_infra_host_information",
      action: actionGetEntityInfo,
      description: "Gathers entity name and tags for specified entity ID",
      input: {
        entity: idEntityID,
        tagKeys: tagKeys,
      },
      active: true,
      position: {
        x: -3,
        y: 4,
      },
      predecessors: ["get_infra_hosts"],
      conditions: {
        states: {
          get_infra_hosts: "OK",
        },
      },
      withItems: 'entity_id in {{ result("get_infra_hosts").entity_ids }}',
      concurrency: 75,
      retry: {
        count: 2,
        delay: 30,
        failedLoopIterationsOnly: true,
      },
      timeout: 1800,
    },
    get_mobile_custom_rum_apps: {
      name: "get_mobile_custom_rum_apps",
      action: actionGetEntities,
      description:
        "Gathers all the entity IDs of Mobile & Custom RUM Applications",
      input: {
        otherType: "custom_application",
        entityType: "other",
        billingMetrics:
          "builtin:billing.real_user_monitoring.mobile.session.usage_by_app,builtin:billing.real_user_monitoring.mobile.session_with_replay.usage_by_app,builtin:billing.real_user_monitoring.mobile.property.usage_by_application",
      },
      position: {
        x: 0,
        y: 3,
      },
      predecessors: ["get_metric_bucket_usage"],
      conditions: {
        states: {
          get_metric_bucket_usage: "OK",
        },
      },
    },
    send_syn_browser_bizevents: {
      name: "send_syn_browser_bizevents",
      action: actionSendBizEvent,
      description: sendBizEventDesc,
      input: {
        bizeventRef: bizEventRef,
        connectionId: "",
        localIngest: true,
      },
      position: {
        x: 1,
        y: 6,
      },
      predecessors: ["get_syn_browser_billing_usage"],
      conditions: {
        states: {
          get_syn_browser_billing_usage: "OK",
        },
      },
      withItems: 'bizevents in {{ result("get_syn_browser_billing_usage") }}',
      concurrency: 10,
      timeout: 1800,
    },
    get_infra_host_billing_usage: {
      name: "get_infra_host_billing_usage",
      action: actionGetBillingUsage,
      description:
        "Gathers DPS billing usage for specific entity and creates bizevent",
      input: {
        rateCard: rateCard,
        entityInfo: entityInfo,
        entityType: '{{ result("get_infra_hosts").entity_type }}',
        metricBucket: '{{ result("get_metric_bucket_usage").I_percent }}',
        billingMetrics: '{{result("get_infra_hosts").billing_metrics}}',
      },
      active: true,
      position: {
        x: -3,
        y: 5,
      },
      predecessors: ["get_infra_host_information"],
      conditions: {
        states: {
          get_infra_host_information: "OK",
        },
      },
      withItems: 'entity in {{ result("get_infra_host_information") }}',
      concurrency: 10,
      retry: {
        count: 2,
        delay: 20,
        failedLoopIterationsOnly: true,
      },
      timeout: 1800,
    },
    get_serverless_billing_usage: {
      name: "get_serverless_billing_usage",
      action: actionGetBillingUsage,
      description: billingUsageDesc,
      input: {
        rateCard: rateCard,
        entityInfo: entityInfo,
        entityType: '{{ result("get_serverless").entity_type }}',
        billingMetrics: '{{ result("get_serverless").billing_metrics }}',
      },
      position: {
        x: 5,
        y: 5,
      },
      predecessors: ["get_serverless_info"],
      conditions: {
        states: {
          get_serverless_info: "OK",
        },
      },
      withItems: 'entity in {{ result("get_serverless_info") }}',
      concurrency: 10,
      retry: {
        count: 2,
        delay: 10,
        failedLoopIterationsOnly: true,
      },
      timeout: 1800,
    },
    send_syn_3rd_party_bizevents: {
      name: "send_syn_3rd_party_bizevents",
      action: actionSendBizEvent,
      description: sendBizEventDesc,
      input: {
        bizeventRef: bizEventRef,
        connectionId: "",
        localIngest: true,
      },
      position: {
        x: 3,
        y: 6,
      },
      predecessors: ["get_syn_3rd_party_billing_usage"],
      conditions: {
        states: {
          get_syn_3rd_party_billing_usage: "OK",
        },
      },
      withItems: 'bizevents in {{ result("get_syn_3rd_party_billing_usage") }}',
      concurrency: 10,
      timeout: 1800,
    },
    get_syn_browser_billing_usage: {
      name: "get_syn_browser_billing_usage",
      action: actionGetBillingUsage,
      description: billingUsageDesc,
      input: {
        rateCard: rateCard,
        entityInfo: entityInfo,
        entityType: '{{ result("get_syn_browser_monitors").entity_type }}',
        billingMetrics:
          '{{ result("get_syn_browser_monitors").billing_metrics }}',
      },
      position: {
        x: 1,
        y: 5,
      },
      predecessors: ["get_syn_browser_info"],
      conditions: {
        states: {
          get_syn_browser_info: "OK",
        },
      },
      withItems: 'entity in {{ result("get_syn_browser_info") }}',
      concurrency: 10,
      retry: {
        count: 2,
        delay: 15,
        failedLoopIterationsOnly: true,
      },
      timeout: 1800,
    },
    send_k8s_namespaces_bizevents: {
      name: "send_k8s_namespaces_bizevents",
      action: actionSendBizEvent,
      description: sendBizEventDesc,
      input: {
        bizeventRef: bizEventRef,
        connectionId: "",
        localIngest: true,
      },
      position: {
        x: 4,
        y: 6,
      },
      predecessors: ["get_k8s_namespace_billing_usage"],
      conditions: {
        states: {
          get_k8s_namespace_billing_usage: "OK",
        },
      },
      withItems: 'bizevents in {{ result("get_k8s_namespace_billing_usage") }}',
      concurrency: 10,
      timeout: 1800,
    },
    send_syn_http_check_bizevents: {
      name: "send_syn_http_check_bizevents",
      action: actionSendBizEvent,
      description: sendBizEventDesc,
      input: {
        bizeventRef: bizEventRef,
        connectionId: "",
        localIngest: true,
      },
      position: {
        x: 2,
        y: 6,
      },
      predecessors: ["get_syn_http_check_billing_usage"],
      conditions: {
        states: {
          get_syn_http_check_billing_usage: "OK",
        },
      },
      withItems:
        'bizevents in {{ result("get_syn_http_check_billing_usage") }}',
      concurrency: 10,
      timeout: 1800,
    },
    get_mobile_custom_rum_app_info: {
      name: "get_mobile_custom_rum_app_info",
      action: actionGetEntityInfo,
      description: "Gathers entity name and tags for specified entity ID.",
      input: {
        entity: idEntityID,
        tagKeys: tagKeys,
      },
      position: {
        x: 0,
        y: 4,
      },
      predecessors: ["get_mobile_custom_rum_apps"],
      conditions: {
        states: {
          get_mobile_custom_rum_apps: "OK",
        },
      },
      withItems:
        'entity_id in {{ result("get_mobile_custom_rum_apps").entity_ids }}',
      concurrency: 75,
      retry: {
        count: 2,
        delay: 10,
        failedLoopIterationsOnly: true,
      },
      timeout: 1800,
    },
    send_mainframe_hosts_bizevents: {
      name: "send_mainframe_hosts_bizevents",
      action: actionSendBizEvent,
      description: sendBizEventDesc,
      input: {
        bizeventRef: bizEventRef,
        connectionId: "",
        localIngest: true,
      },
      position: {
        x: -5,
        y: 6,
      },
      predecessors: ["get_mainframe_host_billing_usage"],
      conditions: {
        states: {
          get_mainframe_host_billing_usage: "OK",
        },
      },
      withItems:
        'bizevents in {{ result("get_mainframe_host_billing_usage") }}',
      concurrency: 10,
      timeout: 1800,
    },
    get_k8s_namespace_billing_usage: {
      name: "get_k8s_namespace_billing_usage",
      action: actionGetBillingUsage,
      description: billingUsageDesc,
      input: {
        rateCard: rateCard,
        entityInfo: entityInfo,
        entityType: '{{ result("get_k8s_namespaces").entity_type }}',
        billingMetrics: '{{ result("get_k8s_namespaces").billing_metrics }}',
      },
      position: {
        x: 4,
        y: 5,
      },
      predecessors: ["get_k8s_namespace_info"],
      conditions: {
        states: {
          get_k8s_namespace_info: "OK",
        },
      },
      withItems: 'entity in {{ result("get_k8s_namespace_info") }}',
      concurrency: 10,
      retry: {
        count: 2,
        delay: 30,
        failedLoopIterationsOnly: true,
      },
      timeout: 1800,
    },
    get_syn_3rd_party_billing_usage: {
      name: "get_syn_3rd_party_billing_usage",
      action: actionGetBillingUsage,
      description: billingUsageDesc,
      input: {
        rateCard: rateCard,
        entityInfo: entityInfo,
        entityType: '{{ result("get_syn_3rd_party").entity_type }}',
        billingMetrics: '{{ result("get_syn_3rd_party").billing_metrics }}',
      },
      position: {
        x: 3,
        y: 5,
      },
      predecessors: ["get_syn_3rd_party_info"],
      conditions: {
        states: {
          get_syn_3rd_party_info: "OK",
        },
      },
      withItems: 'entity in {{ result("get_syn_3rd_party_info") }}',
      concurrency: 10,
      retry: {
        count: 2,
        delay: 25,
        failedLoopIterationsOnly: true,
      },
      timeout: 1800,
    },
    get_mainframe_host_billing_usage: {
      name: "get_mainframe_host_billing_usage",
      action: actionGetBillingUsage,
      description: billingUsageDesc,
      input: {
        rateCard: rateCard,
        entityInfo: entityInfo,
        entityType: '{{ result("get_mainframe_hosts").entity_type }}',
        billingMetrics: '{{ result("get_mainframe_hosts").billing_metrics }}',
      },
      position: {
        x: -5,
        y: 5,
      },
      predecessors: ["get_mainframe_host_info"],
      conditions: {
        states: {
          get_mainframe_host_info: "OK",
        },
      },
      withItems: 'entity in {{ result("get_mainframe_host_info") }}',
      concurrency: 10,
      retry: {
        count: 2,
        delay: 10,
        failedLoopIterationsOnly: true,
      },
      timeout: 1800,
    },
    get_syn_http_check_billing_usage: {
      name: "get_syn_http_check_billing_usage",
      action: actionGetBillingUsage,
      description: billingUsageDesc,
      input: {
        rateCard: rateCard,
        entityInfo: entityInfo,
        entityType: '{{ result("get_syn_http_checks").entity_type }}',
        billingMetrics: '{{ result("get_syn_http_checks").billing_metrics }}',
      },
      position: {
        x: 2,
        y: 5,
      },
      predecessors: ["get_syn_http_check_info"],
      conditions: {
        states: {
          get_syn_http_check_info: "OK",
        },
      },
      withItems: 'entity in {{ result("get_syn_http_check_info") }}',
      concurrency: 10,
      retry: {
        count: 2,
        delay: 20,
        failedLoopIterationsOnly: true,
      },
      timeout: 1800,
    },
    send_mobile_custom_app_bizevents: {
      name: "send_mobile_custom_app_bizevents",
      action: actionSendBizEvent,
      description: sendBizEventDesc,
      input: {
        bizeventRef: bizEventRef,
        connectionId: "",
        localIngest: true,
      },
      position: {
        x: 0,
        y: 6,
      },
      predecessors: ["get_mobile_custom_rum_app_billing_usage"],
      conditions: {
        states: {
          get_mobile_custom_rum_app_billing_usage: "OK",
        },
      },
      withItems:
        'bizevents in {{ result("get_mobile_custom_rum_app_billing_usage") }}',
      concurrency: 10,
      timeout: 1800,
    },
    get_mobile_custom_rum_app_billing_usage: {
      name: "get_mobile_custom_rum_app_billing_usage",
      action: actionGetBillingUsage,
      description: billingUsageDesc,
      input: {
        rateCard: rateCard,
        entityInfo: entityInfo,
        entityType: '{{ result("get_mobile_custom_rum_apps").entity_type }}',
        billingMetrics:
          '{{ result("get_mobile_custom_rum_apps").billing_metrics }}',
      },
      position: {
        x: 0,
        y: 5,
      },
      predecessors: ["get_mobile_custom_rum_app_info"],
      conditions: {
        states: {
          get_mobile_custom_rum_app_info: "OK",
        },
      },
      withItems: 'entity in {{ result("get_mobile_custom_rum_app_info") }}',
      concurrency: 10,
      retry: {
        count: 2,
        delay: 10,
        failedLoopIterationsOnly: true,
      },
      timeout: 1800,
    },
  },
  description: "",
  ownerType: "USER",
  isPrivate: true,
  trigger: {},
  schemaVersion: 3,
};
