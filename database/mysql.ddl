CREATE TABLE `battles` (
  `battle_id` varchar(255) NOT NULL,
  `season_code` varchar(20) DEFAULT NULL,
  `grade_code` varchar(20) DEFAULT NULL,
  `battle_result` varchar(10) DEFAULT NULL,
  `my_dec_code` varchar(50) DEFAULT NULL,
  `enemy_dec_code` varchar(50) DEFAULT NULL,
  `first_pick` int DEFAULT NULL,
  `m_dec` varchar(50) DEFAULT NULL,
  `e_dec` varchar(50) DEFAULT NULL,
  `m_preban` varchar(20) DEFAULT NULL,
  `e_preban` varchar(20) DEFAULT NULL,
  `m_pic1` varchar(10) DEFAULT NULL,
  `m_pic2` varchar(10) DEFAULT NULL,
  `m_pic3` varchar(10) DEFAULT NULL,
  `m_pic4` varchar(10) DEFAULT NULL,
  `m_pic5` varchar(10) DEFAULT NULL,
  `e_pic1` varchar(10) DEFAULT NULL,
  `e_pic2` varchar(10) DEFAULT NULL,
  `e_pic3` varchar(10) DEFAULT NULL,
  `e_pic4` varchar(10) DEFAULT NULL,
  `e_pic5` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`battle_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

CREATE INDEX enemy_dec_code_index on battles(enemy_dec_code);