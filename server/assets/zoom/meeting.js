(function() {
	var _this = this;

	_this.eventBridgeUuid = "com.tivolicloud.zoom";

	_this.entityId;

	_this.webEventReceived = function(entityId, jsonStr) {
		if (entityId != _this.entityId) return;

		var data;
		try {
			data = JSON.parse(jsonStr);
		} catch (err) {
			return;
		}

		if (data.uuid != _this.eventBridgeUuid) return;

		if (data.key == "username")
			Entities.emitScriptEvent(
				_this.entityId,
				JSON.stringify({
					key: "username",
					value: AccountServices.username,
					uuid: _this.eventBridgeUuid
				})
			);
	};

	_this.preload = function(entityId) {
		_this.entityId = entityId;
		Entities.webEventReceived.connect(_this.webEventReceived);
	};

	_this.unload = function() {
		Entities.webEventReceived.disconnect(_this.webEventReceived);
	};
});
