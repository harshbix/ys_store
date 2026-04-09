import { getPresets, getPresetById, getComponentsByType, getComponentTypes } from './pcBuilderRepository.js';

export async function listPresetsController(req, res, next) {
  try {
    const { data, error } = await getPresets();

    if (error) {
      return res.status(500).json({
        ok: false,
        code: 'presets_fetch_failed',
        message: error.message
      });
    }

    return res.json({
      ok: true,
      data: data || []
    });
  } catch (err) {
    next(err);
  }
}

export async function getPresetController(req, res, next) {
  try {
    const { presetId } = req.params;

    const { data, error } = await getPresetById(presetId);

    if (error) {
      return res.status(500).json({
        ok: false,
        code: 'preset_fetch_failed',
        message: error.message
      });
    }

    if (!data) {
      return res.status(404).json({
        ok: false,
        code: 'preset_not_found',
        message: 'Preset not found'
      });
    }

    return res.json({
      ok: true,
      data
    });
  } catch (err) {
    next(err);
  }
}

export async function listComponentsController(req, res, next) {
  try {
    const { type } = req.query;

    if (!type) {
      return res.status(400).json({
        ok: false,
        code: 'type_required',
        message: 'Component type is required'
      });
    }

    const { data, error } = await getComponentsByType(type);

    if (error) {
      return res.status(500).json({
        ok: false,
        code: 'components_fetch_failed',
        message: error.message
      });
    }

    return res.json({
      ok: true,
      data: data || []
    });
  } catch (err) {
    next(err);
  }
}

export async function listComponentTypesController(req, res, next) {
  try {
    const { data, error } = await getComponentTypes();

    if (error) {
      return res.status(500).json({
        ok: false,
        code: 'types_fetch_failed',
        message: error.message
      });
    }

    return res.json({
      ok: true,
      data: data || []
    });
  } catch (err) {
    next(err);
  }
}
