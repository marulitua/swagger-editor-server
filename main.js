export default {
	load() {
		// Build a system
		const ui = SwaggerUIBundle({
			url: function() {
				if (window.SWAGGER_FILE === undefined) return `${window.location}/swagger.json`
				return window.SWAGGER_FILE
			}(),
			dom_id: '#swagger-ui',
			validatorUrl: false,
			presets: [
				SwaggerUIBundle.presets.apis,
				SwaggerUIStandalonePreset
			],
			plugins: [
				SwaggerUIBundle.plugins.DownloadUrl
			],
			layout: "StandaloneLayout"
		})
		window.ui = ui
	}
};
