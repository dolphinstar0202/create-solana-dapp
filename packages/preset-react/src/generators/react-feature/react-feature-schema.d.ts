/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export interface ReactFeatureSchema {
  name: string;
  /**
   * Anchor project name
   */
  anchorName?: string;
  /**
   * Name of the web application (overrides name)
   */
  webName?: string;
  /**
   * The preset to use
   */
  preset?: "next" | "react";
  /**
   * The feature to generate
   */
  feature?: "anchor-counter";
  /**
   * The UI library to use
   */
  ui?: "none" | "tailwind";
  /**
   * The npm scope to use
   */
  npmScope?: string;
  /**
   * Skip formatting files
   */
  skipFormat?: boolean;
}
