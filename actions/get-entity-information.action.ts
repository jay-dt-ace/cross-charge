import {
  UnsuccessfulActionError,
  userLogger,
} from "@dynatrace-sdk/automation-action-utils/actions";
import { giveMeaningFullErrorMessage } from "../ui/app/utils/helpers";
import { getEntityInfoSchema } from "../ui/shared/types/get-entity-info";

interface ActionResponseType {
  entity_id: string;
  entity_name?: string;
  tags: Record<string, string>;
}

interface EntityType {
  name?: string;
  id?: string;
  tags?: string[];
}

interface TagAliasType {
  tag_key: string;
  tag_alias?: string;
}

function compareTagKeys(entity: EntityType, tagKeys: TagAliasType[]) {
  /**
   * Here, we're comparing the tags
   * We get tags from rateCard Result & tags from entity(for e.g, a host having tags ['dev-hosts'])
   * Check both the tag keys, and return the tags, that are common in the form of obj. If the tag key doesn't
   * exist on the entity, add it as "unknown" for the bizevent.
   * Returned data will be:
   * tags: { tagKey: tagValue|''|'unknown' }
   */

  const tags: Record<string, string> = {};

  if (entity.tags && entity.tags.length > 0) {
    for (const tagConfig of tagKeys) {
      let tagExists: boolean = false;
      for (const entityTag of entity.tags) {
        const key: string = findTagKey(stripBrackets(entityTag));
        const value: string = findTagValue(stripBrackets(entityTag));
        if (tagConfig.tag_key === key) {
          tagExists = true;
          tags[tagAlias(tagConfig)] = value;
        }
      }

      if (!tagExists) {
        // only add it as unknown if it's not already there
        // this helps prevent overwriting tags with the same alias
        if (!(tagAlias(tagConfig) in tags)) {
          tags[tagAlias(tagConfig)] = "unknown";
        }
      }
    }
  }
  return tags;
}

function stripBrackets(entityTag: string) {
  try {
    const tagPrefix = RegExp("^\\[.*\\]");
    const tagParts = entityTag.split(tagPrefix);
    if (tagParts.length === 1) {
      return tagParts[0];
    } else if (tagParts.length === 2) {
      return tagParts[1];
    } else {
      return entityTag;
    }
  } catch (error: unknown) {
    userLogger.error(error as string);
    return "";
  }
}

function findTagKey(entityTag: string) {
  try {
    const keyValueSplit = RegExp("\\b:\\b");
    const tagArray = entityTag.split(keyValueSplit);
    let key = tagArray[0];
    key = key.replace(/\\:/g, ":");
    return key;
  } catch (error: unknown) {
    userLogger.error(error as string);
    return "";
  }
}

function findTagValue(entityTag: string) {
  let value: string = "";
  try {
    const keyValueSplit = RegExp("\\b:\\b");
    const tagArray = entityTag.split(keyValueSplit);
    if (tagArray.length === 2) {
      value = tagArray[1];
      value = value.replace(/\\:/g, ":");
    }
  } catch (error: unknown) {
    userLogger.error(error as string);
    value = "";
  }
  return value;
}

function tagAlias(tagConfig: TagAliasType) {
  if (tagConfig.tag_alias) {
    return tagConfig.tag_alias;
  } else {
    return tagConfig.tag_key;
  }
}

export default (rawPayload: unknown) => {
  const payload = getEntityInfoSchema.parse(rawPayload);
  let response = {} as ActionResponseType;

  try {
    if (!payload.entity.id) {
      throw new UnsuccessfulActionError(
        "Input field 'entity id' placeholder is missing.",
      );
    }

    // if (!payload.tagKeys) {
    //   throw new UnsuccessfulActionError("Input field 'tag keys' placeholder is missing.");
    // }

    const tags = compareTagKeys(payload.entity, payload.tagKeys);

    response = {
      entity_id: payload.entity.id,
      entity_name: payload.entity.name,
      tags: tags,
    };
  } catch (error: unknown) {
    const message = giveMeaningFullErrorMessage(error);
    userLogger.error(message);
    throw new UnsuccessfulActionError(
      `Failed to fetch entity info: ${message}`,
    );
  }

  return response;
};
