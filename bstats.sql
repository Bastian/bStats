SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;


CREATE TABLE `charts` (
  `chart_uid` mediumint(8) UNSIGNED NOT NULL COMMENT 'The unique chart id. Not the normal chart id!',
  `chart_id` varchar(32) NOT NULL COMMENT 'A non-unique chart_id chosen by the user itself. It''s unique per plugin.',
  `plugin_id` smallint(5) UNSIGNED NOT NULL,
  `chart_type` varchar(16) NOT NULL,
  `position` tinyint(3) UNSIGNED NOT NULL,
  `default_chart` tinyint(1) NOT NULL,
  `title` varchar(64) NOT NULL,
  `data` text NOT NULL COMMENT 'Saved in JSON format'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

INSERT INTO `charts` (`chart_uid`, `chart_id`, `plugin_id`, `chart_type`, `position`, `default_chart`, `title`, `data`) VALUES
(1, 'javaVersion', 1, 'drilldown_pie', 8, 1, 'Java Version', '{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}}'),
(2, 'os', 1, 'drilldown_pie', 6, 1, 'Operating System', '{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}}'),
(3, 'servers', 1, 'single_linechart', 0, 1, 'Servers', '{"lineName":"Servers","filter":{"enabled":false,"maxValue":2147483647,"minValue":-2147483647}}'),
(4, 'players', 1, 'single_linechart', 1, 1, 'Players', '{"lineName":"Players","filter":{"enabled":false,"maxValue":2147483647,"minValue":-2147483647}}'),
(5, 'onlineMode', 1, 'simple_pie', 2, 1, 'Online mode', '{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}}'),
(6, 'minecraftVersion', 1, 'simple_pie', 3, 1, 'Minecraft Version', '{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}}'),
(7, 'coreCount', 1, 'simple_pie', 4, 1, 'Core count', '{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}}'),
(8, 'osArch', 1, 'simple_pie', 5, 1, 'System arch', '{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}}'),
(9, 'location', 1, 'simple_pie', 7, 1, 'Server Location', '{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}}'),
(10, 'locationMap', 1, 'simple_map', 9, 1, 'Server Location', '{"valueName":"Servers","filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}}'),
(11, 'servers', 3, 'single_linechart', 0, 1, 'Servers', '{"lineName":"Servers","filter":{"enabled":false,"maxValue":1,"minValue":1}}'),
(12, 'osArch', 3, 'simple_pie', 5, 1, 'System arch', '{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}}'),
(13, 'coreCount', 3, 'simple_pie', 4, 1, 'Core count', '{"filter":{"enabled":true,"useRegex":true,"blacklist":false,"filter":["([0-9]){1,2}"]}}'),
(14, 'onlineMode', 3, 'simple_pie', 2, 1, 'Online mode', '{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}}'),
(15, 'players', 3, 'single_linechart', 1, 1, 'Players', '{"lineName":"Players","filter":{"enabled":true,"maxValue":200,"minValue":0}}'),
(16, 'location', 3, 'simple_pie', 7, 1, 'Server Location', '{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}}'),
(17, 'os', 3, 'drilldown_pie', 6, 1, 'Operating System', '{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}}'),
(18, 'minecraftVersion', 3, 'simple_pie', 3, 1, 'Minecraft Version', '{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}}'),
(19, 'locationMap', 3, 'simple_map', 9, 1, 'Server Location', '{"valueName":"Servers","filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}}'),
(20, 'javaVersion', 3, 'drilldown_pie', 8, 1, 'Java Version', '{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}}'),
(21, 'location', 2, 'simple_pie', 8, 1, 'Server Location', '{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}}'),
(22, 'servers', 2, 'single_linechart', 0, 1, 'Proxy Servers', '{"lineName":"Servers","filter":{"enabled":false,"maxValue":1,"minValue":1}}'),
(23, 'players', 2, 'single_linechart', 2, 1, 'Players', '{"lineName":"Players","filter":{"enabled":true,"maxValue":200,"minValue":0}}'),
(24, 'managed_servers', 2, 'single_linechart', 1, 1, 'Managed Servers', '{"lineName":"Servers","filter":{"enabled":true,"maxValue":25,"minValue":0}}'),
(25, 'onlineMode', 2, 'simple_pie', 3, 1, 'Online mode', '{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}}'),
(26, 'bungeecordVersion', 2, 'simple_pie', 4, 1, 'Bungeecord Version', '{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}}'),
(27, 'coreCount', 2, 'simple_pie', 5, 1, 'Core count', '{"filter":{"enabled":true,"useRegex":true,"blacklist":false,"filter":["([0-9]){1,2}"]}}'),
(28, 'osArch', 2, 'simple_pie', 6, 1, 'System arch', '{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}}'),
(29, 'os', 2, 'drilldown_pie', 7, 1, 'Operating System', '{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}}'),
(30, 'javaVersion', 2, 'drilldown_pie', 9, 1, 'Java Version', '{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}}'),
(31, 'locationMap', 2, 'simple_map', 10, 1, 'Server Location', '{"valueName":"Servers","filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}}');

CREATE TABLE `line_charts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `chart_uid` mediumint(10) UNSIGNED NOT NULL COMMENT 'The unique chart id. Not the normal chart id!',
  `line` tinyint(3) UNSIGNED NOT NULL,
  `value` int(11) NOT NULL,
  `tms_2000` mediumint(8) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `line_charts_processed` (
  `id` smallint(5) UNSIGNED NOT NULL,
  `chart_uid` mediumint(8) UNSIGNED NOT NULL COMMENT 'The unique chart id. Not the normal chart id!',
  `line` tinyint(3) UNSIGNED NOT NULL,
  `data` longtext NOT NULL,
  `last_processed_tms_2000` mediumint(8) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

INSERT INTO `line_charts_processed` (`id`, `chart_uid`, `line`, `data`, `last_processed_tms_2000`) VALUES
(1, 3, 1, '[]', 0),
(2, 4, 1, '[]', 0),
(3, 11, 1, '[]', 0),
(4, 15, 1, '[]', 0),
(5, 23, 1, '[]', 0),
(6, 24, 1, '[]', 0),
(7, 22, 1, '[]', 0);

CREATE TABLE `plugins` (
  `plugin_id` smallint(5) UNSIGNED NOT NULL,
  `plugin_name` varchar(32) NOT NULL,
  `owner_id` smallint(5) UNSIGNED NOT NULL,
  `server_software` tinyint(3) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

INSERT INTO `plugins` (`plugin_id`, `plugin_name`, `owner_id`, `server_software`) VALUES
(1, '_bukkit_', 1, 1),
(2, '_bungeecord_', 1, 2),
(3, '_sponge_', 1, 3);

CREATE TABLE `server_software` (
  `software_id` tinyint(3) UNSIGNED NOT NULL,
  `software_name` varchar(32) NOT NULL,
  `software_url` varchar(32) NOT NULL,
  `plugin_id` smallint(5) UNSIGNED DEFAULT NULL COMMENT 'The fake plugin which represents the global stats',
  `default_charts` text NOT NULL COMMENT 'The default charts for the given server software in JSON format',
  `max_requests_per_ip` tinyint(3) UNSIGNED NOT NULL,
  `metrics_class` tinytext,
  `class_creation` tinytext
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

INSERT INTO `server_software` (`software_id`, `software_name`, `software_url`, `plugin_id`, `default_charts`, `max_requests_per_ip`, `metrics_class`, `class_creation`) VALUES
(1, 'Bukkit / Spigot', 'bukkit', 1, '[{"type":"single_linechart","id":"servers","title":"Servers using %plugin.name%","data":{"lineName":"Servers","filter":{"enabled":false,"maxValue":1,"minValue":1}},"requestParser":{"predefinedValue":1}},{"type":"single_linechart","id":"players","title":"Players on servers using %plugin.name%","data":{"lineName":"Players","filter":{"enabled":true,"maxValue":200,"minValue":0}},"requestParser":{"nameInRequest":"playerAmount","type":"number","position":"global"}},{"type":"simple_pie","id":"onlineMode","title":"Online mode","data":{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}},"requestParser":{"nameInRequest":"onlineMode","position":"global","type":"boolean","trueValue":"online","falseValue":"offline"}},{"type":"simple_pie","id":"minecraftVersion","title":"Minecraft Version","data":{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}},"requestParser":{"nameInRequest":"bukkitVersion","position":"global"}},{"type":"simple_pie","id":"pluginVersion","title":"Plugin Version","data":{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}},"requestParser":{"nameInRequest":"pluginVersion","position":"plugin"}},{"type":"simple_pie","id":"coreCount","title":"Core count","data":{"filter":{"enabled":true,"useRegex":true,"blacklist":false,"filter":["([0-9]){1,2}"]}},"requestParser":{"nameInRequest":"coreCount","type":"number","position":"global"}},{"type":"simple_pie","id":"osArch","title":"System arch","data":{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}},"requestParser":{"nameInRequest":"osArch","position":"global"}},{"type":"drilldown_pie","id":"os","title":"Operating System","data":{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}},"requestParser":{"position":"global","useHardcodedParser":"os"}},{"type":"simple_pie","id":"location","title":"Server Location","data":{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}},"requestParser":{"predefinedValue":"%country.name%"}},{"type":"drilldown_pie","id":"javaVersion","title":"Java Version","data":{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}},"requestParser":{"useHardcodedParser":"javaVersion","position":"global"}},{"type":"simple_map","id":"locationMap","title":"Server Location","data":{"valueName":"Servers","filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}},"requestParser":{"predefinedValue":"AUTO"}}]', 5, 'https://github.com/BtoBastian/bStats-Metrics/blob/master/bstats-bukkit/src/main/java/org/bstats/Metrics.java', 'https://github.com/BtoBastian/bStats-Metrics/blob/master/bstats-bukkit/src/examples/java/ExamplePlugin.java'),
(2, 'Bungeecord', 'bungeecord', 2, '[{"type":"single_linechart","id":"servers","title":"Bungeecord Servers using %plugin.name%","data":{"lineName":"Servers","filter":{"enabled":false,"maxValue":1,"minValue":1}},"requestParser":{"predefinedValue":1}},{"type":"single_linechart","id":"players","title":"Players on servers using %plugin.name%","data":{"lineName":"Players","filter":{"enabled":true,"maxValue":800,"minValue":0}},"requestParser":{"nameInRequest":"playerAmount","type":"number","position":"global"}},{"type":"single_linechart","id":"managed_servers","title":"Servers managed by Bungeecord servers","data":{"lineName":"Servers","filter":{"enabled":true,"maxValue":25,"minValue":0}},"requestParser":{"nameInRequest":"managedServers","type":"number","position":"global"}},{"type":"simple_pie","id":"onlineMode","title":"Online mode","data":{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}},"requestParser":{"nameInRequest":"onlineMode","position":"global","type":"boolean","trueValue":"online","falseValue":"offline"}},{"type":"simple_pie","id":"bungeecordVersion","title":"Bungeecord Version","data":{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}},"requestParser":{"position":"global","useHardcodedParser":"bungeecordVersion"}},{"type":"simple_pie","id":"pluginVersion","title":"Plugin Version","data":{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}},"requestParser":{"nameInRequest":"pluginVersion","position":"plugin"}},{"type":"simple_pie","id":"coreCount","title":"Core count","data":{"filter":{"enabled":true,"useRegex":true,"blacklist":false,"filter":["([0-9]){1,2}"]}},"requestParser":{"nameInRequest":"coreCount","type":"number","position":"global"}},{"type":"simple_pie","id":"osArch","title":"System arch","data":{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}},"requestParser":{"nameInRequest":"osArch","position":"global"}},{"type":"drilldown_pie","id":"os","title":"Operating System","data":{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}},"requestParser":{"position":"global","useHardcodedParser":"os"}},{"type":"simple_pie","id":"location","title":"Server Location","data":{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}},"requestParser":{"predefinedValue":"%country.name%"}},{"type":"drilldown_pie","id":"javaVersion","title":"Java Version","data":{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}},"requestParser":{"useHardcodedParser":"javaVersion","position":"global"}},{"type":"simple_map","id":"locationMap","title":"Server Location","data":{"valueName":"Servers","filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}},"requestParser":{"predefinedValue":"AUTO"}}]', 2, 'https://github.com/BtoBastian/bStats-Metrics/blob/master/bstats-bungeecord/src/main/java/org/bstats/Metrics.java', 'https://github.com/BtoBastian/bStats-Metrics/blob/master/bstats-bungeecord/src/examples/java/ExamplePlugin.java'),
(3, 'Sponge', 'sponge', 3, '[{"type":"single_linechart","id":"servers","title":"Servers using %plugin.name%","data":{"lineName":"Servers","filter":{"enabled":false,"maxValue":1,"minValue":1}},"requestParser":{"predefinedValue":1}},{"type":"single_linechart","id":"players","title":"Players on servers using %plugin.name%","data":{"lineName":"Players","filter":{"enabled":true,"maxValue":200,"minValue":0}},"requestParser":{"nameInRequest":"playerAmount","type":"number","position":"global"}},{"type":"simple_pie","id":"onlineMode","title":"Online mode","data":{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}},"requestParser":{"nameInRequest":"onlineMode","position":"global","type":"boolean","trueValue":"online","falseValue":"offline"}},{"type":"simple_pie","id":"minecraftVersion","title":"Minecraft Version","data":{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}},"requestParser":{"nameInRequest":"minecraftVersion","position":"global"}},{"type":"simple_pie","id":"pluginVersion","title":"Plugin Version","data":{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}},"requestParser":{"nameInRequest":"pluginVersion","position":"plugin"}},{"type":"simple_pie","id":"coreCount","title":"Core count","data":{"filter":{"enabled":true,"useRegex":true,"blacklist":false,"filter":["([0-9]){1,2}"]}},"requestParser":{"nameInRequest":"coreCount","type":"number","position":"global"}},{"type":"simple_pie","id":"osArch","title":"System arch","data":{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}},"requestParser":{"nameInRequest":"osArch","position":"global"}},{"type":"drilldown_pie","id":"os","title":"Operating System","data":{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}},"requestParser":{"position":"global","useHardcodedParser":"os"}},{"type":"simple_pie","id":"location","title":"Server Location","data":{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}},"requestParser":{"predefinedValue":"%country.name%"}},{"type":"drilldown_pie","id":"javaVersion","title":"Java Version","data":{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}},"requestParser":{"useHardcodedParser":"javaVersion","position":"global"}},{"type":"simple_map","id":"locationMap","title":"Server Location","data":{"valueName":"Servers","filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}},"requestParser":{"predefinedValue":"AUTO"}}]', 5, 'https://github.com/BtoBastian/bStats-Metrics/blob/master/bstats-sponge/src/main/java/org/bstats/Metrics.java', 'https://github.com/BtoBastian/bStats-Metrics/blob/master/bstats-sponge/src/examples/java/ExamplePlugin.java'),
(4, 'Server Implementation', 'server-implementation', NULL, '[{"type":"single_linechart","id":"servers","title":"Servers using %plugin.name%","data":{"lineName":"Servers","filter":{"enabled":false,"maxValue":1,"minValue":1}},"requestParser":{"predefinedValue":1}},{"type":"simple_pie","id":"coreCount","title":"Core count","data":{"filter":{"enabled":true,"useRegex":true,"blacklist":false,"filter":["([0-9]){1,2}"]}},"requestParser":{"nameInRequest":"coreCount","type":"number","position":"global"}},{"type":"simple_pie","id":"osArch","title":"System arch","data":{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}},"requestParser":{"nameInRequest":"osArch","position":"global"}},{"type":"drilldown_pie","id":"os","title":"Operating System","data":{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}},"requestParser":{"position":"global","useHardcodedParser":"os"}},{"type":"simple_pie","id":"location","title":"Server Location","data":{"filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}},"requestParser":{"predefinedValue":"%country.name%"}},{"type":"simple_map","id":"locationMap","title":"Server Location","data":{"valueName":"Servers","filter":{"enabled":false,"useRegex":false,"blacklist":false,"filter":[]}},"requestParser":{"predefinedValue":"AUTO"}}]', 5, NULL, NULL);

CREATE TABLE `users` (
  `id` smallint(5) UNSIGNED NOT NULL,
  `username` varchar(16) NOT NULL,
  `password` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

INSERT INTO `users` (`id`, `username`, `password`) VALUES
(1, 'Admin', 'none');


ALTER TABLE `charts`
  ADD PRIMARY KEY (`chart_uid`),
  ADD UNIQUE KEY `chart_uid` (`chart_uid`),
  ADD KEY `plugin_id` (`plugin_id`);

ALTER TABLE `line_charts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `chart_id` (`chart_uid`,`line`,`tms_2000`) USING BTREE,
  ADD UNIQUE KEY `id` (`id`);

ALTER TABLE `line_charts_processed`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `chart_id` (`chart_uid`,`line`) USING BTREE,
  ADD UNIQUE KEY `id` (`id`);

ALTER TABLE `plugins`
  ADD PRIMARY KEY (`plugin_id`),
  ADD UNIQUE KEY `plugin_id` (`plugin_id`),
  ADD UNIQUE KEY `plugin_name` (`plugin_name`,`server_software`),
  ADD KEY `owner_id` (`owner_id`),
  ADD KEY `server_software` (`server_software`);

ALTER TABLE `server_software`
  ADD PRIMARY KEY (`software_id`),
  ADD UNIQUE KEY `id` (`software_id`),
  ADD UNIQUE KEY `plugin_id` (`plugin_id`);

ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id` (`id`);


ALTER TABLE `charts`
  MODIFY `chart_uid` mediumint(8) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'The unique chart id. Not the normal chart id!', AUTO_INCREMENT=32;
ALTER TABLE `line_charts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `line_charts_processed`
  MODIFY `id` smallint(5) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
ALTER TABLE `plugins`
  MODIFY `plugin_id` smallint(5) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
ALTER TABLE `server_software`
  MODIFY `software_id` tinyint(3) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
ALTER TABLE `users`
  MODIFY `id` smallint(5) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

ALTER TABLE `charts`
  ADD CONSTRAINT `charts_ibfk_1` FOREIGN KEY (`plugin_id`) REFERENCES `plugins` (`plugin_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `line_charts`
  ADD CONSTRAINT `line_charts_ibfk_1` FOREIGN KEY (`chart_uid`) REFERENCES `charts` (`chart_uid`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `line_charts_processed`
  ADD CONSTRAINT `line_charts_processed_ibfk_1` FOREIGN KEY (`chart_uid`) REFERENCES `charts` (`chart_uid`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `plugins`
  ADD CONSTRAINT `plugins_ibfk_1` FOREIGN KEY (`server_software`) REFERENCES `server_software` (`software_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `users_plugins_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`);

ALTER TABLE `server_software`
  ADD CONSTRAINT `server_software_ibfk_1` FOREIGN KEY (`plugin_id`) REFERENCES `plugins` (`plugin_id`) ON UPDATE CASCADE;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
